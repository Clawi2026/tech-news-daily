#!/bin/bash
# 快速 RSS 新闻抓取脚本

OUTPUT_DIR="/home/admin/openclaw/workspace/tech-news-daily/public/data"
TEMP_DIR="/tmp/nr"
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

echo "📰 抓取 RSS..."
curl -s -m 5 -A "Mozilla/5.0" "https://techcrunch.com/feed/" -o "$TEMP_DIR/tc.xml" && echo "  ✓ TechCrunch" || true
curl -s -m 5 -A "Mozilla/5.0" "https://www.theverge.com/rss/index.xml" -o "$TEMP_DIR/vg.xml" && echo "  ✓ TheVerge" || true
curl -s -m 5 -A "Mozilla/5.0" "https://feeds.arstechnica.com/arstechnica/index" -o "$TEMP_DIR/ars.xml" && echo "  ✓ ArsTechnica" || true
curl -s -m 5 -A "Mozilla/5.0" "https://www.wired.com/feed/rss" -o "$TEMP_DIR/wired.xml" && echo "  ✓ Wired" || true
curl -s -m 5 -A "Mozilla/5.0" "https://feeds.bbci.co.uk/news/technology/rss.xml" -o "$TEMP_DIR/bbc.xml" && echo "  ✓ BBC" || true
curl -s -m 5 -A "Mozilla/5.0" "https://www.cnet.com/rss/news/" -o "$TEMP_DIR/cnet.xml" && echo "  ✓ CNET" || true
curl -s -m 5 -A "Mozilla/5.0" "https://sspai.com/feed" -o "$TEMP_DIR/sspai.xml" && echo "  ✓ 少数派" || true

echo "解析并保存..."
cd /home/admin/openclaw/workspace/tech-news-daily && node -e "
const fs = require('fs');
const { Parser } = require('xml2js');
const parser = new Parser();
const TEMP = '/tmp/nr';
const OUTPUT = '$OUTPUT_DIR';

const SOURCES = [
  { f: 'tc.xml', n: 'TechCrunch', c: '科技创业', l: 'en' },
  { f: 'vg.xml', n: 'The Verge', c: '科技文化', l: 'en' },
  { f: 'ars.xml', n: 'Ars Technica', c: '深度科技', l: 'en' },
  { f: 'wired.xml', n: 'Wired', c: '科技趋势', l: 'en' },
  { f: 'bbc.xml', n: 'BBC Technology', c: '综合科技', l: 'en' },
  { f: 'cnet.xml', n: 'CNET', c: '数码产品', l: 'en' },
  { f: 'sspai.xml', n: '少数派', c: '数码生活', l: 'zh' }
];

(async () => {
  const allNews = [];
  
  for (const src of SOURCES) {
    try {
      const xml = fs.readFileSync(TEMP + '/' + src.f, 'utf8');
      if (xml.length < 50) throw new Error('empty');
      const result = await parser.parseStringPromise(xml);
      const channel = result.rss?.channel?.[0];
      const feed = result.feed;
      let items = channel?.item || feed?.entry || [];
      if (!Array.isArray(items)) items = [items];
      
      items.slice(0, 3).forEach(item => {
        const title = Array.isArray(item.title) ? item.title[0] : item.title;
        const linkRaw = item.link?.[0]?.\$?.href || (Array.isArray(item.link) ? item.link[0] : item.link);
        const link = linkRaw || '#';
        const descRaw = item.description?.[0] || item.summary?.[0] || '';
        const desc = typeof descRaw === 'string' ? descRaw : '';
        const pubDate = item.pubDate?.[0] || item.published?.[0] || new Date().toISOString();
        const cleanDesc = desc.replace(/<[^>]*>/g, '').substring(0, 200);
        
        allNews.push({
          id: Buffer.from(link).toString('base64').slice(0, 12),
          source: src.n,
          title: title || '无标题',
          originalTitle: title || '无标题',
          summary: cleanDesc,
          originalSummary: cleanDesc,
          url: link,
          publishedAt: new Date(pubDate).toISOString(),
          language: src.l,
          category: src.c
        });
      });
      console.log('  ✓ ' + src.n + ': ' + Math.min(items.length, 3) + '条');
    } catch (e) {
      console.log('  ✗ ' + src.n + ': ' + e.message);
    }
  }
  
  allNews.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  const seen = new Set();
  const deduped = allNews.filter(a => { if (seen.has(a.url)) return false; seen.add(a.url); return true; });
  
  fs.writeFileSync(OUTPUT + '/latest.json', JSON.stringify(deduped, null, 2));
  fs.writeFileSync(OUTPUT + '/2026-03-23.json', JSON.stringify(deduped, null, 2));
  console.log('✅ 完成！' + deduped.length + ' 条新闻');
  console.log('📁 ' + OUTPUT + '/latest.json');
})();
"

rm -rf "$TEMP_DIR"
