#!/usr/bin/env node
/**
 * 全球科技新闻抓取脚本 - RSS 版本
 * 从多个 RSS 源获取新闻，翻译为中文，输出 JSON
 */

const fetch = require('node-fetch').default || require('node-fetch');
const { Parser } = require('xml2js');
const fs = require('fs');
const path = require('path');

// 10 个新闻源配置
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

// 翻译 API
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
    console.error(`翻译失败：${error.message}`);
    return text;
  }
}

// 解析 RSS Feed
async function fetchRSS(source) {
  console.log(`  → 抓取 ${source.name} (${source.category})...`);
  
  try {
    const response = await fetch(source.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TechNewsDaily/1.0)' },
      timeout: 15000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const xml = await response.text();
    const parser = new Parser();
    const result = await parser.parseStringPromise(xml);
    
    // 处理不同 RSS 格式
    const items = result.rss?.channel?.[0]?.item || 
                  result.feed?.entry || 
                  result.rdf?.item ||
                  [];
    
    const articles = [];
    for (const item of items.slice(0, 5)) { // 每个源最多 5 条
      const title = item.title?.[0] || item.title || '无标题';
      const link = item.link?.[0]?.$?.href || item.link?.[0] || item.link || '#';
      const description = item.description?.[0] || item.summary?.[0] || item.content?.[0]?._ || '';
      const pubDate = item.pubDate?.[0] || item.published?.[0] || new Date().toISOString();
      
      // 翻译
      const translatedTitle = await translateText(title, source.language);
      const cleanDesc = typeof description === 'string' 
        ? description.replace(/<[^>]*>/g, '').substring(0, 200)
        : '';
      const translatedDesc = await translateText(cleanDesc, source.language);
      
      articles.push({
        id: Buffer.from(link).toString('base64').substring(0, 12),
        source: source.name,
        title: translatedTitle,
        originalTitle: title,
        summary: translatedDesc,
        originalSummary: cleanDesc,
        url: link,
        publishedAt: new Date(pubDate).toISOString(),
        language: source.language,
        category: source.category
      });
    }
    
    console.log(`    ✓ 找到 ${articles.length} 条新闻`);
    return articles;
  } catch (error) {
    console.error(`  ❌ ${source.name} 抓取失败：${error.message}`);
    return [];
  }
}

// 主函数
async function main() {
  console.log('📰 开始抓取全球科技新闻...');
  console.log(`   新闻源：${NEWS_SOURCES.length} 个（7 个国外 + 3 个国内）`);
  console.log(`   时间：${new Date().toISOString()}`);
  console.log('');
  
  const allNews = [];
  
  // 并行抓取所有源
  const promises = NEWS_SOURCES.map(source => fetchRSS(source));
  const results = await Promise.all(promises);
  
  results.forEach(articles => allNews.push(...articles));
  
  // 按发布时间排序
  allNews.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  
  // 保存文件
  const outputDir = path.join(__dirname, '../public/data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const today = new Date().toISOString().split('T')[0];
  const outputPath = path.join(outputDir, `${today}.json`);
  const latestPath = path.join(outputDir, 'latest.json');
  
  // 去重：基于 URL 去重
  const seen = new Set();
  const dedupedNews = allNews.filter(article => {
    if (seen.has(article.url)) return false;
    seen.add(article.url);
    return true;
  });
  
  console.log(`📊 去重后：${dedupedNews.length} 条（移除 ${allNews.length - dedupedNews.length} 条重复）`);
  
  // 输出数组格式（前端期望的格式）
  fs.writeFileSync(latestPath, JSON.stringify(dedupedNews, null, 2), 'utf8');
  fs.writeFileSync(outputPath, JSON.stringify(dedupedNews, null, 2), 'utf8');
  
  console.log('');
  console.log(`✅ 完成！共抓取 ${allNews.length} 条新闻`);
  console.log(`📁 保存到：${latestPath}`);
  
  // 统计
  const sourceStats = {};
  allNews.forEach(n => {
    sourceStats[n.source] = (sourceStats[n.source] || 0) + 1;
  });
  console.log('');
  console.log('📊 新闻源统计:');
  Object.entries(sourceStats).forEach(([source, count]) => {
    console.log(`   ${source}: ${count} 条`);
  });
  
  return outputData;
}

// 运行
main().catch(console.error);

module.exports = { main };
