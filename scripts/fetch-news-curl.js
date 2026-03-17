#!/usr/bin/env node
/**
 * 快速新闻抓取脚本 - 使用 curl
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 新闻源配置
const NEWS_SOURCES = [
  { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', language: 'en', category: '科技创业' },
  { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', language: 'en', category: '科技文化' },
  { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', language: 'en', category: '深度科技' },
  { name: 'Wired', url: 'https://www.wired.com/feed/rss', language: 'en', category: '科技趋势' },
  { name: 'BBC Technology', url: 'http://feeds.bbci.co.uk/news/technology/rss.xml', language: 'en', category: '综合科技' },
  { name: 'CNET', url: 'https://www.cnet.com/rss/news/', language: 'en', category: '数码产品' },
  { name: 'Bloomberg Tech', url: 'https://www.bloomberg.com/technology/rss', language: 'en', category: '科技财经' },
  { name: '36Kr', url: 'https://www.36kr.com/feed', language: 'zh', category: '中国科技' },
  { name: '虎嗅', url: 'https://www.huxiu.com/rss', language: 'zh', category: '商业科技' },
  { name: '少数派', url: 'https://sspai.com/feed', language: 'zh', category: '数码生活' }
];

// 解析 RSS
function parseRSS(xml, source) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>|<entry>([\s\S]*?)<\/entry>/g;
  let match;
  
  while ((match = itemRegex.exec(xml)) !== null) {
    const content = match[1] || match[2];
    if (!content) continue;
    
    const titleMatch = /<title(?:[^>]*)>([\s\S]*?)<\/title>/.exec(content);
    const linkMatch = /<link[^>]*>([\s\S]*?)<\/link>|<link[^>]*href="([^"]*)"/.exec(content);
    const descMatch = /<description>([\s\S]*?)<\/description>|<summary[^>]*>([\s\S]*?)<\/summary>/.exec(content);
    const pubDateMatch = /<pubDate>([\s\S]*?)<\/pubDate>|<published>([\s\S]*?)<\/published>|<updated>([\s\S]*?)<\/updated>/.exec(content);
    
    let title = titleMatch ? titleMatch[1]
      .replace(/<!\[CDATA\[|\]\]>/g, '')
      .replace(/&#[0-9]+;|&[a-z]+;/g, m => {
        const entities = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'", '&#8217;': "'", '&#8216;': "'", '&#8220;': '"', '&#8221;': '"', '&#8211;': '-' };
        return entities[m] || m;
      })
      .trim() : '';
    
    let link = linkMatch ? (linkMatch[1] || linkMatch[2] || '').trim() : '';
    let description = descMatch ? (descMatch[1] || descMatch[2] || '').replace(/<[^>]*>/g, '').trim() : '';
    let pubDate = pubDateMatch ? (pubDateMatch[1] || pubDateMatch[2] || pubDateMatch[3] || '').trim() : new Date().toISOString();
    
    if (title && title.length > 5 && link && link.startsWith('http')) {
      items.push({ title, link, description: description.substring(0, 200), pubDate });
    }
  }
  
  return items.slice(0, 3);
}

// 翻译 API 配置
// 长期方案：百度翻译 API（免费 200 万字符/月）
// 注册：https://fanyi-api.baidu.com/product/11
const BAIDU_APP_ID = process.env.BAIDU_APP_ID || '';
const BAIDU_SECRET_KEY = process.env.BAIDU_SECRET_KEY || '';

// 翻译 API 列表（按优先级）
const TRANSLATE_APIS = [
  {
    name: '百度翻译',
    translate: async (text, from, to) => {
      if (!BAIDU_APP_ID || !BAIDU_SECRET_KEY) {
        throw new Error('未配置百度翻译 API');
      }
      const crypto = require('crypto');
      const salt = Date.now().toString();
      const signStr = `${BAIDU_APP_ID}${text}${salt}${BAIDU_SECRET_KEY}`;
      const sign = crypto.createHash('md5').update(signStr).digest('hex');
      
      const url = 'https://fanyi-api.baidu.com/api/trans/vip/translate';
      const params = new URLSearchParams({
        q: text,
        from: from === 'en' ? 'en' : 'auto',
        to: 'zh',
        appid: BAIDU_APP_ID,
        salt: salt,
        sign: sign
      });
      
      const res = await fetch(`${url}?${params}`, { timeout: 10000 });
      const data = await res.json();
      if (data.trans_result && Array.isArray(data.trans_result)) {
        return data.trans_result.map(x => x.dst).join('');
      }
      if (data.error_code) throw new Error(`百度翻译错误：${data.error_msg}`);
      throw new Error('翻译失败');
    }
  },
  {
    name: 'MyMemory',
    translate: async (text, from, to) => {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;
      const res = await fetch(url, { timeout: 5000 });
      const data = await res.json();
      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        return data.responseData.translatedText;
      }
      if (data.responseStatus === 429) throw new Error('配额用完');
      throw new Error(data.message || 'Translation failed');
    }
  },
  {
    name: 'LibreTranslate',
    translate: async (text, from, to) => {
      const instances = [
        'https://libretranslate.com/translate',
        'https://translate.terraprint.com/translate',
        'https://trans.zillyhuhn.com/translate'
      ];
      for (const baseUrl of instances) {
        try {
          const res = await fetch(baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ q: text, source: from === 'en' ? 'en' : 'auto', target: to, format: 'text' }),
            timeout: 10000
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          if (data.translatedText) return data.translatedText;
        } catch (e) {
          continue;
        }
      }
      throw new Error('所有实例失败');
    }
  }
];

// 多 API 翻译（自动切换）
async function translateText(text, from, to = 'zh') {
  if (from === 'zh' || !text || text.length === 0) return text;
  
  // 短文本不翻译（节省配额）
  if (text.length < 10) return text;
  
  for (const api of TRANSLATE_APIS) {
    try {
      const truncated = text.length > 500 ? text.substring(0, 500) : text;
      const result = await api.translate(truncated, from, to);
      if (result && result !== text) {
        console.log(`    ✓ 翻译成功 (${api.name})`);
        return result;
      }
    } catch (error) {
      console.log(`    ⚠ ${api.name} 失败：${error.message}`);
      continue;
    }
  }
  
  console.log(`    ❌ 所有翻译 API 失败，使用原文`);
  return text;
}

// 抓取单个源
function fetchSource(source) {
  console.log(`  → 抓取 ${source.name} (${source.category})...`);
  try {
    const xml = execSync(`curl -s --max-time 15 -A "Mozilla/5.0" "${source.url}"`, {
      encoding: 'utf8',
      timeout: 20000
    });
    const items = parseRSS(xml, source);
    console.log(`    ✓ 找到 ${items.length} 条新闻`);
    return { source, items, error: null };
  } catch (error) {
    console.error(`  ❌ ${source.name} 抓取失败：${error.message}`);
    return { source, items: [], error: error.message };
  }
}

// 主函数
async function main() {
  console.log('📰 开始抓取全球科技新闻...');
  console.log(`   新闻源：${NEWS_SOURCES.length} 个（7 个国外 + 3 个国内）`);
  console.log(`   时间：${new Date().toISOString()}`);
  console.log('');
  
  const results = NEWS_SOURCES.map(source => fetchSource(source));
  const allNews = [];
  
  for (const result of results) {
    for (const item of result.items) {
      const translatedTitle = await translateText(item.title, result.source.language);
      const translatedDesc = await translateText(item.description, result.source.language);
      
      allNews.push({
        id: Buffer.from(item.link).toString('base64').substring(0, 12),
        source: result.source.name,
        title: translatedTitle,
        originalTitle: item.title,
        summary: translatedDesc,
        originalSummary: item.description,
        url: item.link,
        publishedAt: new Date(item.pubDate).toISOString(),
        language: result.source.language,
        category: result.source.category
      });
    }
  }
  
  // 排序
  allNews.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  
  // 保存
  const outputDir = path.join(__dirname, '../public/data');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  
  // 去重
  const seen = new Set();
  const dedupedNews = allNews.filter(article => {
    if (seen.has(article.url)) return false;
    seen.add(article.url);
    return true;
  });
  
  console.log(`\n📊 去重：${allNews.length} → ${dedupedNews.length} 条（移除 ${allNews.length - dedupedNews.length} 条重复）`);
  
  const latestPath = path.join(outputDir, 'latest.json');
  // 输出数组格式（前端期望）
  fs.writeFileSync(latestPath, JSON.stringify(dedupedNews, null, 2), 'utf8');
  
  console.log('');
  console.log(`✅ 完成！共抓取 ${allNews.length} 条新闻`);
  console.log(`📁 保存到：${latestPath}`);
  
  const sourceStats = {};
  allNews.forEach(n => { sourceStats[n.source] = (sourceStats[n.source] || 0) + 1; });
  console.log('');
  console.log('📊 新闻源统计:');
  Object.entries(sourceStats).forEach(([source, count]) => {
    console.log(`   ${source}: ${count} 条`);
  });
  
  return outputData;
}

main().catch(console.error);
