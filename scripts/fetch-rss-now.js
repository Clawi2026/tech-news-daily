#!/usr/bin/env node
const fetch = require('node-fetch').default || require('node-fetch');
const { Parser } = require('xml2js');
const fs = require('fs');

const NEWS_SOURCES = [
  { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', language: 'en', category: '科技创业' },
  { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', language: 'en', category: '科技文化' },
  { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', language: 'en', category: '深度科技' },
  { name: 'Wired', url: 'https://www.wired.com/feed/rss', language: 'en', category: '科技趋势' },
  { name: 'BBC Technology', url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', language: 'en', category: '综合科技' },
  { name: 'CNET', url: 'https://www.cnet.com/rss/news/', language: 'en', category: '数码产品' },
  { name: '36Kr', url: 'https://www.36kr.com/feed', language: 'zh', category: '中国科技' },
  { name: '少数派', url: 'https://sspai.com/feed', language: 'zh', category: '数码生活' }
];

async function fetchRSS(source) {
  try {
    const response = await fetch(source.url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000
    });
    if (!response.ok) return [];
    const xml = await response.text();
    const parser = new Parser();
    const result = await parser.parseStringPromise(xml);
    const items = result.rss?.channel?.[0]?.item || result.feed?.entry || [];
    return items.slice(0, 3).map(item => {
      const titleRaw = item.title?.[0] || item.title;
      const title = typeof titleRaw === 'object' ? (titleRaw._ || '无标题') : (titleRaw || '无标题');
      const linkRaw = item.link?.[0]?.$?.href || item.link?.[0] || item.link;
      const link = typeof linkRaw === 'object' ? (linkRaw._ || linkRaw.$?.href || '#') : (linkRaw || '#');
      const descRaw = item.description?.[0] || item.summary?.[0] || '';
      const description = typeof descRaw === 'object' ? (descRaw._ || '') : (descRaw || '');
      const pubDate = item.pubDate?.[0] || item.published?.[0] || new Date().toISOString();
      const cleanDesc = typeof description === 'string' ? description.replace(/<[^>]*>/g, '').substring(0, 200) : '';
      return {
        id: Buffer.from(link).toString('base64').substring(0, 12),
        source: source.name,
        title: title,
        originalTitle: title,
        summary: cleanDesc,
        originalSummary: cleanDesc,
        url: link,
        publishedAt: new Date(pubDate).toISOString(),
        language: source.language,
        category: source.category
      };
    });
  } catch (error) {
    console.error(`❌ ${source.name}: ${error.message}`);
    return [];
  }
}

(async () => {
  console.log('📰 开始抓取...');
  const allNews = [];
  const promises = NEWS_SOURCES.map(source => {
    console.log(`  → ${source.name}`);
    return fetchRSS(source);
  });
  const results = await Promise.all(promises);
  results.forEach(articles => {
    allNews.push(...articles);
    console.log(`    ✓ ${articles.length}条`);
  });
  
  allNews.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  
  const seen = new Set();
  const dedupedNews = allNews.filter(article => {
    if (seen.has(article.url)) return false;
    seen.add(article.url);
    return true;
  });
  
  const outputDir = '/home/admin/openclaw/workspace/tech-news-daily/public/data';
  fs.writeFileSync(outputDir + '/latest.json', JSON.stringify(dedupedNews, null, 2), 'utf8');
  fs.writeFileSync(outputDir + '/2026-03-23.json', JSON.stringify(dedupedNews, null, 2), 'utf8');
  
  console.log(`✅ 完成！共 ${dedupedNews.length} 条`);
  console.log(`📁 已保存`);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
