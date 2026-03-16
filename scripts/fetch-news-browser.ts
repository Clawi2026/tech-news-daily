/**
 * 全球科技新闻抓取脚本（浏览器版）
 * 从 10+ 个全球主流科技媒体抓取新闻，翻译为中文
 */

import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

// 新闻源配置 - 7 个国外 + 3 个国内
const NEWS_SOURCES = [
  // 国外媒体（英文）
  {
    name: 'TechCrunch',
    url: 'https://techcrunch.com',
    language: 'en',
    category: '科技创业',
    selector: {
      article: 'article, .post-block',
      title: 'h1, h2, h3, [class*="title"]',
      link: 'a[href*="techcrunch.com"]',
      desc: 'p, [class*="excerpt"]',
      time: 'time'
    }
  },
  {
    name: 'The Verge',
    url: 'https://www.theverge.com',
    language: 'en',
    category: '科技文化',
    selector: {
      article: 'article, .entry',
      title: 'h1, h2, h3',
      link: 'a[href*="theverge.com"]',
      desc: 'p, .entry-content',
      time: 'time'
    }
  },
  {
    name: 'Ars Technica',
    url: 'https://arstechnica.com',
    language: 'en',
    category: '深度科技',
    selector: {
      article: 'article, .post',
      title: 'h1, h2, h3',
      link: 'a[href*="arstechnica.com"]',
      desc: 'p, .post-excerpt',
      time: 'time'
    }
  },
  {
    name: 'Wired',
    url: 'https://www.wired.com',
    language: 'en',
    category: '科技趋势',
    selector: {
      article: 'article, .Card',
      title: 'h1, h2, h3',
      link: 'a[href*="wired.com"]',
      desc: 'p, .summary',
      time: 'time'
    }
  },
  {
    name: 'BBC Technology',
    url: 'https://www.bbc.com/news/technology',
    language: 'en',
    category: '综合科技',
    selector: {
      article: 'article, [data-testid="card-text-wrapper"]',
      title: 'h1, h2, h3',
      link: 'a[href*="bbc.com"]',
      desc: 'p',
      time: 'time'
    }
  },
  {
    name: 'CNET',
    url: 'https://www.cnet.com',
    language: 'en',
    category: '数码产品',
    selector: {
      article: 'article, .card',
      title: 'h1, h2, h3',
      link: 'a[href*="cnet.com"]',
      desc: 'p, .summary',
      time: 'time'
    }
  },
  {
    name: 'Bloomberg Tech',
    url: 'https://www.bloomberg.com/technology',
    language: 'en',
    category: '科技财经',
    selector: {
      article: 'article, .headline',
      title: 'h1, h2, h3',
      link: 'a[href*="bloomberg.com"]',
      desc: 'p, .summary',
      time: 'time'
    }
  },
  // 国内媒体（中文）
  {
    name: '36Kr',
    url: 'https://www.36kr.com',
    language: 'zh',
    category: '中国科技',
    selector: {
      article: 'article, .post-item',
      title: 'h1, h2, h3, [class*="title"]',
      link: 'a[href*="36kr.com"]',
      desc: 'p, .summary',
      time: 'time'
    }
  },
  {
    name: '虎嗅',
    url: 'https://www.huxiu.com',
    language: 'zh',
    category: '商业科技',
    selector: {
      article: 'article, .article-item',
      title: 'h1, h2, h3, [class*="title"]',
      link: 'a[href*="huxiu.com"]',
      desc: 'p, .article-desc',
      time: 'time'
    }
  },
  {
    name: '少数派',
    url: 'https://sspai.com',
    language: 'zh',
    category: '数码生活',
    selector: {
      article: 'article, .article-item',
      title: 'h1, h2, h3, [class*="title"]',
      link: 'a[href*="sspai.com"]',
      desc: 'p, .article-summary',
      time: 'time'
    }
  }
];

// 翻译 API
async function translateText(text: string, from: string, to: string = 'zh'): Promise<string> {
  if (from === 'zh' || text.length === 0) {
    return text;
  }
  
  try {
    const truncated = text.length > 500 ? text.substring(0, 500) : text;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(truncated)}&langpair=${from}|${to}`;
    const response = await fetch(url);
    const data = await response.json() as any;
    
    if (data.responseStatus === 200) {
      return data.responseData.translatedText || text;
    }
    return text;
  } catch (error) {
    console.error(`翻译失败：${error}`);
    return text;
  }
}

// 抓取单个新闻源
async function fetchSource(page: any, source: any): Promise<any[]> {
  const items: any[] = [];
  
  try {
    await page.goto(source.url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForSelector(source.selector.article, { timeout: 10000 });
    
    const articles = await page.evaluate((selector: any) => {
      const results: any[] = [];
      const articleElements = document.querySelectorAll(selector.article);
      
      articleElements.forEach((el: Element) => {
        const titleEl = el.querySelector(selector.title);
        const linkEl = el.querySelector(selector.link);
        const descEl = el.querySelector(selector.desc);
        const timeEl = el.querySelector(selector.time);
        
        if (titleEl && linkEl) {
          const title = titleEl.textContent?.trim() || '';
          const link = linkEl.getAttribute('href') || '';
          const description = descEl?.textContent?.trim() || '';
          const pubDate = timeEl?.getAttribute('datetime') || timeEl?.textContent?.trim() || '';
          
          if (title && link && !results.find(r => r.link === link) && title.length > 5) {
            results.push({
              title,
              link: link.startsWith('http') ? link : new URL(link, source.url).href,
              description: description.substring(0, 200),
              pubDate
            });
          }
        }
      });
      
      return results.slice(0, 5);
    }, source.selector);
    
    console.log(`    找到 ${articles.length} 条新闻`);
    
    for (const item of articles) {
      const translatedTitle = await translateText(item.title, source.language);
      const translatedDesc = await translateText(item.description, source.language);
      
      items.push({
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
  } catch (error) {
    console.error(`  抓取 ${source.name} 失败：${(error as Error).message}`);
  }
  
  return items;
}

// 主函数
async function main() {
  console.log('📰 开始抓取全球科技新闻...');
  console.log(`   新闻源：${NEWS_SOURCES.length} 个（${NEWS_SOURCES.filter(s => s.language === 'en').length} 国外 + ${NEWS_SOURCES.filter(s => s.language === 'zh').length} 国内）`);
  
  const allNews: any[] = [];
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    for (const source of NEWS_SOURCES) {
      console.log(`  → 抓取 ${source.name} (${source.category})...`);
      
      const page = await browser.newPage();
      
      const items = await fetchSource(page, source);
      allNews.push(...items);
      
      await page.close();
    }
  } finally {
    await browser.close();
  }
  
  // 按发布时间排序
  allNews.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  
  // 输出结果
  const outputDir = path.join(__dirname, '../public/data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const today = new Date().toISOString().split('T')[0];
  const outputPath = path.join(outputDir, `${today}.json`);
  const latestPath = path.join(outputDir, 'latest.json');
  
  fs.writeFileSync(latestPath, JSON.stringify(allNews, null, 2), 'utf8');
  fs.writeFileSync(outputPath, JSON.stringify(allNews, null, 2), 'utf8');
  
  console.log(`✅ 完成！共抓取 ${allNews.length} 条新闻`);
  console.log(`📁 保存到：${latestPath}`);
  
  // 统计各新闻源数量
  const sourceStats: Record<string, number> = {};
  allNews.forEach(n => {
    sourceStats[n.source] = (sourceStats[n.source] || 0) + 1;
  });
  console.log('📊 新闻源统计:');
  Object.entries(sourceStats).forEach(([source, count]) => {
    console.log(`   ${source}: ${count} 条`);
  });
  
  return allNews;
}

// 运行
main().catch(console.error);
