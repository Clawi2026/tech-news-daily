#!/usr/bin/env ts-node
/**
 * 全球科技新闻抓取脚本
 * 从多个 RSS 源获取新闻，翻译为中文，输出 JSON
 */

import fetch from 'node-fetch';
import { Parser } from 'xml2js';
import * as fs from 'fs';
import * as path from 'path';

// 新闻源配置
const NEWS_SOURCES = [
  {
    name: 'TechCrunch',
    url: 'https://techcrunch.com/feed/',
    language: 'en',
    category: '科技创业'
  },
  {
    name: 'HackerNews',
    url: 'https://hnrss.org/frontpage',
    language: 'en',
    category: '开发者'
  },
  {
    name: 'The Verge',
    url: 'https://www.theverge.com/rss/index.xml',
    language: 'en',
    category: '科技文化'
  },
  {
    name: 'Ars Technica',
    url: 'https://feeds.arstechnica.com/arstechnica/index',
    language: 'en',
    category: '深度科技'
  },
  {
    name: 'BBC Technology',
    url: 'http://feeds.bbci.co.uk/news/technology/rss.xml',
    language: 'en',
    category: '综合科技'
  },
  {
    name: '36Kr',
    url: 'https://www.36kr.com/feed',
    language: 'zh',
    category: '中国科技'
  },
  {
    name: '虎嗅',
    url: 'https://www.huxiu.com/rss',
    language: 'zh',
    category: '商业科技'
  },
  {
    name: '少数派',
    url: 'https://sspai.com/feed',
    language: 'zh',
    category: '数码生活'
  }
];

// 翻译 API（使用免费的 MyMemory Translation API）
async function translateText(text: string, from: string, to: string = 'zh'): Promise<string> {
  if (from === 'zh') {
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
    console.error(`翻译失败: ${error}`);
    return text;
  }
}

// 解析 RSS Feed
async function fetchRSS(url: string): Promise<any[]> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TechNewsDaily/1.0)'
      }
    });
    const xml = await response.text();
    const parser = new Parser();
    const result = await parser.parseStringPromise(xml);
    
    // 处理不同 RSS 格式
    const items = result.rss?.channel?.[0]?.item || 
                  result.feed?.entry || 
                  result.rdf?.item ||
                  [];
    
    return items.map((item: any) => ({
      title: item.title?.[0] || item.title || '无标题',
      link: item.link?.[0]?.$?.href || item.link?.[0] || item.link || '#',
      description: item.description?.[0] || item.summary?.[0] || item.content?.[0]?._ || '',
      pubDate: item.pubDate?.[0] || item.published?.[0] || new Date().toISOString(),
      source: item.source?.[0]?._ || 'Unknown'
    }));
  } catch (error) {
    console.error(`获取 RSS 失败 ${url}: ${error}`);
    return [];
  }
}

// 主函数
async function main() {
  console.log('📰 开始抓取全球科技新闻...');
  
  const allNews: any[] = [];
  
  for (const source of NEWS_SOURCES) {
    console.log(`  → 抓取 ${source.name} (${source.category})...`);
    
    const items = await fetchRSS(source.url);
    
    for (const item of items.slice(0, 10)) { // 每个源最多 10 条
      const translatedTitle = await translateText(item.title, source.language);
      const translatedDesc = await translateText(
        item.description.replace(/<[^>]*>/g, '').substring(0, 200),
        source.language
      );
      
      allNews.push({
        id: Buffer.from(item.link).toString('base64').substring(0, 12),
        title: translatedTitle,
        originalTitle: item.title,
        description: translatedDesc,
        link: item.link,
        source: source.name,
        category: source.category,
        language: source.language,
        publishedAt: new Date(item.pubDate).toISOString(),
        fetchedAt: new Date().toISOString()
      });
    }
  }
  
  // 按发布时间排序
  allNews.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  
  // 输出结果
  const outputDir = path.join(__dirname, '../data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const today = new Date().toISOString().split('T')[0];
  const outputPath = path.join(outputDir, `${today}.json`);
  
  fs.writeFileSync(outputPath, JSON.stringify(allNews, null, 2));
  
  // 同时更新 latest.json（最新新闻）
  const latestPath = path.join(outputDir, 'latest.json');
  fs.writeFileSync(latestPath, JSON.stringify(allNews, null, 2));
  
  console.log(`✅ 完成！共抓取 ${allNews.length} 条新闻`);
  console.log(`📁 保存到: ${outputPath}`);
  
  return allNews;
}

// 运行
main().catch(console.error);

export { main };
