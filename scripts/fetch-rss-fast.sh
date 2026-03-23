#!/bin/bash
# 快速 RSS 抓取脚本 - 使用 curl + node

OUTPUT_DIR="/home/admin/openclaw/workspace/tech-news-daily/public/data"
TEMP_DIR="/tmp/news-rss"
mkdir -p "$TEMP_DIR"

echo "📰 开始抓取 RSS..."

# 并行抓取所有 RSS 源
curl -s -A "Mozilla/5.0" "https://techcrunch.com/feed/" -o "$TEMP_DIR/techcrunch.xml" &
curl -s -A "Mozilla/5.0" "https://www.theverge.com/rss/index.xml" -o "$TEMP_DIR/verge.xml" &
curl -s -A "Mozilla/5.0" "https://feeds.arstechnica.com/arstechnica/index" -o "$TEMP_DIR/ars.xml" &
curl -s -A "Mozilla/5.0" "https://www.wired.com/feed/rss" -o "$TEMP_DIR/wired.xml" &
curl -s -A "Mozilla/5.0" "https://feeds.bbci.co.uk/news/technology/rss.xml" -o "$TEMP_DIR/bbc.xml" &
curl -s -A "Mozilla/5.0" "https://www.cnet.com/rss/news/" -o "$TEMP_DIR/cnet.xml" &
curl -s -A "Mozilla/5.0" "https://sspai.com/feed" -o "$TEMP_DIR/sspai.xml" &

wait
echo "✓ RSS 下载完成"

# 用 node 解析并合并
node -e "
const fs = require('fs');
const { Parser } = require('xml2js');
const path = require('path');

const SOURCES = [
  { file: 'techcrunch.xml', name: 'TechCrunch', cat: '科技创业', lang: 'en' },
  { file: 'verge.xml', name: 'The Verge', cat: '科技文化', lang: 'en' },
  { file: 'ars.xml', name: 'Ars Technica', cat: '深度科技', lang: 'en' },
  { file: 'wired.xml', name: 'Wired', cat: '科技趋势', lang: 'en' },
  { file: 'bbc.xml', name: 'BBC Technology', cat: '综合科技', lang: 'en' },
  { file: 'cnet.xml', name: 'CNET', cat: '数码产品', lang: 'en' },
  { file: 'sspai.xml', name: '少数派', cat: '数码生活', lang: 'zh' }
];

const parser = new Parser();
const allNews = [];

(async () => {
  for (const src of SOURCES) {
    try {
      const xml = fs.readFileSync('/tmp/news-rss/' + src.file, 'utf8');
      const result = await parser.parseStringPromise(xml);
      const items = result.rss?.channel?.[0]?.item || result.feed?.entry || [];
      for (const item of items.slice(0, 3)) {
        const titleRaw = item.title?.[0] || item.title;
        const title = typeof titleRaw === 'object' ? (titleRaw._ || '无标题') : (titleRaw || '无标题');
        const linkRaw = item.link?.[0]?.\$?.href || item.link?.[0] || item.link;
        const link = typeof linkRaw === 'object' ? (linkRaw._ || linkRaw.\$?.href || '#') : (linkRaw || '#');
        const descRaw = item.description?.[0] || item.summary?.[0] || '';
        const description = typeof descRaw === 'object' ? (descRaw._ || '') : (descRaw || '');
        const pubDate = item.pubDate?.[0] || item.published?.[0] || new Date().toISOString();
        const cleanDesc = typeof description === 'string' ? description.replace(/<[^>]*>/g, '').substring(0, 200) : '';
        allNews.push({
          id: Buffer.from(link).toString('base64').substring(0, 12),
          source: src.name,
          title: title,
          originalTitle: title,
          summary: cleanDesc,
          originalSummary: cleanDesc,
          url: link,
          publishedAt: new Date(pubDate).toISOString(),
          language: src.lang,
          category: src.cat
        });
      }
      console.log('  ✓ ' + src.name + ': ' + items.slice(0, 3).length + '条');
    } catch (e) {
      console.error('  ❌ ' + src.name + ': ' + e.message);
    }
  }
  
  allNews.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  
  const seen = new Set();
  const dedupedNews = allNews.filter(article => {
    if (seen.has(article.url)) return false;
    seen.add(article.url);
    return true;
  });
  
  fs.writeFileSync('$OUTPUT_DIR/latest.json', JSON.stringify(dedupedNews, null, 2), 'utf8');
  fs.writeFileSync('$OUTPUT_DIR/2026-03-23.json', JSON.stringify(dedupedNews, null, 2), 'utf8');
  
  console.log('✅ 完成！共 ' + dedupedNews.length + ' 条新闻');
  console.log('📁 已保存到 latest.json');
})().catch(console.error);
"

# 清理
rm -rf "$TEMP_DIR"
