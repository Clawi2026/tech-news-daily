const fetch = require('node-fetch').default || require('node-fetch');
const { Parser } = require('xml2js');
const fs = require('fs');
const path = require('path');

// 翻译函数 - 使用 MyMemory API
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
  } catch (e) {
    console.error(`  ⚠️ 翻译失败：${e.message}`);
  }
  return text; // 失败时返回原文
}

const NEWS_SOURCES = [
  { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', language: 'en', category: '科技创业' },
  { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', language: 'en', category: '科技文化' },
  { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', language: 'en', category: '深度科技' },
  { name: 'Wired', url: 'https://www.wired.com/feed/rss', language: 'en', category: '科技趋势' },
  { name: 'CNET', url: 'https://www.cnet.com/rss/news/', language: 'en', category: '数码产品' },
  { name: '36Kr', url: 'https://www.36kr.com/feed', language: 'zh', category: '中国科技' },
  { name: '少数派', url: 'https://sspai.com/feed', language: 'zh', category: '数码生活' }
];

async function fetchRSS(source) {
  console.log(`  → ${source.name}...`);
  try {
    const response = await fetch(source.url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const xml = await response.text();
    const parser = new Parser();
    const result = await parser.parseStringPromise(xml);
    
    const items = result.rss?.channel?.[0]?.item || result.feed?.entry || [];
    const articles = [];
    
    for (const item of items.slice(0, 5)) {
      const title = item.title?.[0] || 'No title';
      const link = item.link?.[0]?._ || item.link?.[0] || item.id?.[0] || '';
      const pubDate = item.pubDate?.[0] || new Date().toISOString();
      const descRaw = item.description?.[0] || item.summary?.[0] || '';
      const cleanDesc = typeof descRaw === 'string' ? descRaw.replace(/<[^>]*>/g, '').substring(0, 200) : '';
      
      // 翻译英文内容
      const translatedTitle = source.language === 'en' ? await translateText(title, 'en') : title;
      const translatedDesc = source.language === 'en' ? await translateText(cleanDesc, 'en') : cleanDesc;
      
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
    
    console.log(`    ✓ ${articles.length}条`);
    return articles;
  } catch (e) {
    console.error(`  ❌ ${source.name}: ${e.message}`);
    return [];
  }
}

async function main() {
  console.log('📰 快速抓取...\n');
  const allNews = [];
  for (const source of NEWS_SOURCES) {
    const articles = await fetchRSS(source);
    allNews.push(...articles);
  }
  
  allNews.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  const outputDir = path.join(__dirname, '../public/data');
  const today = new Date().toISOString().split('T')[0];
  
  fs.writeFileSync(path.join(outputDir, 'latest.json'), JSON.stringify(allNews, null, 2));
  fs.writeFileSync(path.join(outputDir, `${today}.json`), JSON.stringify(allNews, null, 2));
  
  console.log(`\n✅ 完成！共 ${allNews.length} 条`);
  console.log(`📁 保存到：${outputDir}/latest.json`);
}

main().catch(console.error);
