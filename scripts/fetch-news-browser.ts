/**
 * 全球科技新闻抓取脚本（浏览器版）
 * 使用 Playwright 抓取真实新闻，翻译为中文
 */

import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

// 新闻源配置
const NEWS_SOURCES = [
  {
    name: 'TechCrunch',
    url: 'https://techcrunch.com',
    language: 'en',
    category: '科技创业'
  }
];

// 翻译 API（使用免费的 MyMemory Translation API）
async function translateText(text: string, from: string, to: string = 'zh'): Promise<string> {
  if (from === 'zh' || text.length === 0) {
    return text;
  }
  
  try {
    // 只翻译标题和简短摘要
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

// 主函数
async function main() {
  console.log('📰 开始抓取全球科技新闻...');
  
  const allNews: any[] = [];
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    for (const source of NEWS_SOURCES) {
      console.log(`  → 抓取 ${source.name}...`);
      
      const page = await browser.newPage();
      await page.goto(source.url, { waitUntil: 'networkidle', timeout: 30000 });
      
      // 抓取新闻列表
      const articles = await page.evaluate(() => {
        const items: any[] = [];
        
        // 查找所有文章卡片
        const articleElements = document.querySelectorAll('article, .post-block, [class*="post"], [class*="article"]');
        
        articleElements.forEach((el) => {
          const titleEl = el.querySelector('h1, h2, h3, [class*="title"]');
          const linkEl = el.querySelector('a[href*="techcrunch.com"]');
          const descEl = el.querySelector('p, [class*="excerpt"], [class*="summary"]');
          const timeEl = el.querySelector('time, [class*="time"], [class*="date"]');
          
          if (titleEl && linkEl) {
            const title = titleEl.textContent?.trim() || '';
            const link = linkEl.getAttribute('href') || '';
            const description = descEl?.textContent?.trim() || '';
            const pubDate = timeEl?.getAttribute('datetime') || timeEl?.textContent?.trim() || '';
            
            if (title && link && !items.find(i => i.link === link)) {
              items.push({
                title,
                link,
                description: description.substring(0, 200),
                pubDate
              });
            }
          }
        });
        
        return items.slice(0, 15);
      });
      
      console.log(`    找到 ${articles.length} 条新闻`);
      
      for (const item of articles) {
        const translatedTitle = await translateText(item.title, source.language);
        const translatedDesc = await translateText(item.description, source.language);
        
        allNews.push({
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
  
  fs.writeFileSync(latestPath, JSON.stringify(allNews, null, 2));
  fs.writeFileSync(outputPath, JSON.stringify(allNews, null, 2));
  
  console.log(`✅ 完成！共抓取 ${allNews.length} 条新闻`);
  console.log(`📁 保存到：${latestPath}`);
  
  return allNews;
}

// 运行
main().catch(console.error);
