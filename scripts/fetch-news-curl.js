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

// 翻译
async function translateText(text, from, to = 'zh') {
  if (from === 'zh' || !text || text.length === 0) return text;
  try {
    const truncated = text.length > 500 ? text.substring(0, 500) : text;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(truncated)}&langpair=${from}|${to}`;
    const response = await fetch(url, { timeout: 5000 });
    const data = await response.json();
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return data.responseData.translatedText;
    }
    return text;
  } catch (error) {
    return text;
  }
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
  
  const outputData = {
    updatedAt: new Date().toISOString(),
    sources: NEWS_SOURCES.length,
    totalArticles: allNews.length,
    articles: allNews
  };
  
  const latestPath = path.join(outputDir, 'latest.json');
  fs.writeFileSync(latestPath, JSON.stringify(outputData, null, 2), 'utf8');
  
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
