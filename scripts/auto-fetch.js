/**
 * 自动新闻抓取脚本
 * 每小时整点从 10 个新闻源抓取最新数据
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 10 个新闻源配置 - 只抓取科技新闻
const NEWS_SOURCES = [
  // 国外媒体（7 个）
  { 
    name: 'TechCrunch', 
    url: 'https://techcrunch.com/category/startups/', 
    language: 'en', 
    category: '科技创业',
    keywords: ['AI', 'startup', 'tech', 'app', 'software', 'robot', 'chip', 'data']
  },
  { 
    name: 'The Verge', 
    url: 'https://www.theverge.com/tech', 
    language: 'en', 
    category: '科技文化',
    keywords: ['tech', 'gadget', 'AI', 'phone', 'computer', 'software']
  },
  { 
    name: 'Ars Technica', 
    url: 'https://arstechnica.com/', 
    language: 'en', 
    category: '深度科技',
    keywords: ['technology', 'science', 'AI', 'computing', 'software']
  },
  { 
    name: 'Wired', 
    url: 'https://www.wired.com/', 
    language: 'en', 
    category: '科技趋势',
    keywords: ['technology', 'AI', 'science', 'digital', 'tech']
  },
  { 
    name: 'BBC Technology', 
    url: 'https://www.bbc.com/news/technology', 
    language: 'en', 
    category: '综合科技',
    keywords: ['technology', 'tech', 'digital', 'AI', 'computer']
  },
  { 
    name: 'CNET', 
    url: 'https://www.cnet.com/tech/', 
    language: 'en', 
    category: '数码产品',
    keywords: ['tech', 'gadget', 'phone', 'computer', 'review']
  },
  { 
    name: 'Bloomberg Tech', 
    url: 'https://www.bloomberg.com/technology', 
    language: 'en', 
    category: '科技财经',
    keywords: ['tech', 'technology', 'startup', 'AI', 'company']
  },
  // 国内媒体（3 个）- 只看科技版块
  { 
    name: '36Kr', 
    url: 'https://www.36kr.com/', 
    language: 'zh', 
    category: '中国科技',
    keywords: ['科技', 'AI', '互联网', '创业', '数码']
  },
  { 
    name: '虎嗅', 
    url: 'https://www.huxiu.com/technology/', 
    language: 'zh', 
    category: '商业科技',
    keywords: ['科技', '互联网', 'AI', '数码', '创业']
  },
  { 
    name: '少数派', 
    url: 'https://sspai.com/', 
    language: 'zh', 
    category: '数码生活',
    keywords: ['数码', '软件', 'APP', '科技', '效率']
  }
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
  console.log(`  → 抓取 ${source.name} (${source.category})...`);
  
  try {
    const page = await browser.newPage();
    await page.goto(source.url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000); // 等待页面加载
    
    const articles = await page.evaluate((source) => {
      const items = [];
      const articleElements = document.querySelectorAll('article, .post, .card, [class*="article"], [class*="post"], li');
      
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
          
          // 过滤：只看科技新闻
          const titleLower = title.toLowerCase();
          const descLower = description.toLowerCase();
          const isTech = source.keywords.some(kw => 
            titleLower.includes(kw.toLowerCase()) || descLower.includes(kw.toLowerCase())
          );
          
          if (title.length > 10 && title.length < 200 && link && isTech && !items.find(i => i.link === link)) {
            items.push({
              title,
              link: link.startsWith('http') ? link : new URL(link, window.location.origin).href,
              description: description.substring(0, 200),
              pubDate
            });
          }
        }
        
        if (items.length >= 10) return items;
      });
      
      return items.slice(0, 10);
    }, source);
    
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
