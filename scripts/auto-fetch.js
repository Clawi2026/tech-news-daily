/**
 * 自动新闻抓取脚本
 * 每小时整点从 10 个新闻源抓取最新数据
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 10 个新闻源配置
const NEWS_SOURCES = [
  // 国外媒体（7 个）
  { name: 'TechCrunch', url: 'https://techcrunch.com', language: 'en', category: '科技创业' },
  { name: 'The Verge', url: 'https://www.theverge.com', language: 'en', category: '科技文化' },
  { name: 'Ars Technica', url: 'https://arstechnica.com', language: 'en', category: '深度科技' },
  { name: 'Wired', url: 'https://www.wired.com', language: 'en', category: '科技趋势' },
  { name: 'BBC Technology', url: 'https://www.bbc.com/news/technology', language: 'en', category: '综合科技' },
  { name: 'CNET', url: 'https://www.cnet.com', language: 'en', category: '数码产品' },
  { name: 'Bloomberg Tech', url: 'https://www.bloomberg.com/technology', language: 'en', category: '科技财经' },
  // 国内媒体（3 个）
  { name: '36Kr', url: 'https://www.36kr.com', language: 'zh', category: '中国科技' },
  { name: '虎嗅', url: 'https://www.huxiu.com', language: 'zh', category: '商业科技' },
  { name: '少数派', url: 'https://sspai.com', language: 'zh', category: '数码生活' }
];

// 翻译 API
async function translateText(text, from, to = 'zh') {
  if (from === 'zh' || !text || text.length === 0) return text;
  try {
    const truncated = text.length > 500 ? text.substring(0, 500) : text;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(truncated)}&langpair=${from}|${to}`;
    const response = await fetch(url);
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

// 抓取单个新闻源
async function fetchSource(browser, source) {
  console.log(`  → 抓取 ${source.name}...`);
  
  try {
    const page = await browser.newPage();
    await page.goto(source.url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000); // 等待页面加载
    
    const articles = await page.evaluate(() => {
      const items = [];
      const articleElements = document.querySelectorAll('article, .post, .card, [class*="article"], [class*="post"]');
      
      articleElements.forEach((el) => {
        const titleEl = el.querySelector('h1, h2, h3, [class*="title"]');
        const linkEl = el.querySelector('a[href]');
        const descEl = el.querySelector('p, [class*="excerpt"], [class*="summary"]');
        const timeEl = el.querySelector('time, [class*="time"], [class*="date"]');
        
        if (titleEl && linkEl) {
          const title = titleEl.textContent?.trim() || '';
          const link = linkEl.getAttribute('href') || '';
          const description = descEl?.textContent?.trim() || '';
          const pubDate = timeEl?.getAttribute('datetime') || timeEl?.textContent?.trim() || new Date().toISOString();
          
          if (title.length > 10 && link && !items.find(i => i.link === link)) {
            items.push({
              title,
              link: link.startsWith('http') ? link : new URL(link, window.location.origin).href,
              description: description.substring(0, 200),
              pubDate
            });
          }
        }
        
        if (items.length >= 5) return items;
      });
      
      return items.slice(0, 5);
    });
    
    await page.close();
    console.log(`    找到 ${articles.length} 条新闻`);
    
    // 翻译并格式化
    const formattedArticles = [];
    for (const item of articles) {
      const translatedTitle = await translateText(item.title, source.language);
      const translatedDesc = await translateText(item.description, source.language);
      
      formattedArticles.push({
        id: Buffer.from(item.link).toString('base64').substring(0, 12),
        title: translatedTitle,
        originalTitle: item.title,
        description: translatedDesc,
        link: item.link,
        source: source.name,
        category: source.category,
        language: source.language,
        publishedAt: item.pubDate || new Date().toISOString(),
        fetchedAt: new Date().toISOString()
      });
    }
    
    return formattedArticles;
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
  
  const allNews = [];
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    for (const source of NEWS_SOURCES) {
      const articles = await fetchSource(browser, source);
      allNews.push(...articles);
    }
  } finally {
    await browser.close();
  }
  
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
  
  fs.writeFileSync(latestPath, JSON.stringify(allNews, null, 2), 'utf8');
  fs.writeFileSync(outputPath, JSON.stringify(allNews, null, 2), 'utf8');
  
  console.log(`\n✅ 完成！共抓取 ${allNews.length} 条新闻`);
  console.log(`📁 保存到：${latestPath}`);
  
  // 统计
  const sourceStats = {};
  allNews.forEach(n => {
    sourceStats[n.source] = (sourceStats[n.source] || 0) + 1;
  });
  console.log('\n📊 新闻源统计:');
  Object.entries(sourceStats).forEach(([source, count]) => {
    console.log(`   ${source}: ${count} 条`);
  });
}

// 运行
main().catch(console.error);
