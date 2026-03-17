#!/usr/bin/env node
/**
 * 快速新闻抓取脚本 - 串行抓取，快速超时
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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(truncated)}&langpair=${from}|${to}`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    const data = await response.json();
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return data.responseData.translatedText;
    }
    return text;
  } catch (error) {
    return text;
  }
}

// 解析 RSS Feed
async function fetchRSS(source) {
  console.log(`  → 抓取 ${source.name}...`);
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(source.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TechNewsDaily/1.0)' },
      signal: controller.signal
    });
    clearTimeout(timeout);
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const xml = await response.text();
    const parser = new Parser();
    const result = await parser.parseStringPromise(xml);
    
    const items = result.rss?.channel?.[0]?.item || 
                  result.feed?.entry || 
                  result.rdf?.item || [];
    
    const articles = [];
    for (const item of items.slice(0, 3)) {
      const title = item.title?.[0] || item.title || '无标题';
      const link = item.link?.[0]?.$?.href || item.link?.[0] || item.link || '#';
      const description = item.description?.[0] || item.summary?.[0] || item.content?.[0]?._ || '';
      const pubDate = item.pubDate?.[0] || item.published?.[0] || new Date().toISOString();
      
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
    
    console.log(`    ✓ ${articles.length} 条`);
    return articles;
  } catch (error) {
    console.log(`    ✗ ${error.message}`);
    return [];
  }
}

// 主函数
async function main() {
  console.log('📰 开始抓取全球科技新闻...');
  console.log(`   新闻源：${NEWS_SOURCES.length} 个`);
  console.log(`   时间：${new Date().toISOString()}\n`);
  
  const allNews = [];
  
  // 串行抓取
  for (const source of NEWS_SOURCES) {
    const articles = await fetchRSS(source);
    allNews.push(...articles);
  }
  
  // 排序
  allNews.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  
  // 保存
  const outputDir = path.join(__dirname, '../public/data');
  const today = new Date().toISOString().split('T')[0];
  
  const outputData = {
    updatedAt: new Date().toISOString(),
    sources: NEWS_SOURCES.length,
    totalArticles: allNews.length,
    articles: allNews
  };
  
  fs.writeFileSync(path.join(outputDir, 'latest.json'), JSON.stringify(outputData, null, 2), 'utf8');
  fs.writeFileSync(path.join(outputDir, `${today}.json`), JSON.stringify(outputData, null, 2), 'utf8');
  
  console.log(`\n✅ 完成！共 ${allNews.length} 条新闻`);
  console.log(`📁 保存至：${outputDir}/latest.json`);
  
  return outputData;
}

main().catch(console.error);
