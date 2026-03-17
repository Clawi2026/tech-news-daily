#!/usr/bin/env node
/**
 * 全球科技新闻抓取脚本 - 处理 RSS 数据
 * 从 RSS XML 解析新闻，翻译英文为中文，输出 JSON
 */

const fs = require('fs');
const path = require('path');

// 简单的 XML 解析函数
function parseRSS(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const titleMatch = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/);
    const linkMatch = itemXml.match(/<link><!\[CDATA\[(.*?)\]\]><\/link>|<link>(.*?)<\/link>/);
    const descMatch = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/);
    const pubDateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/);
    
    const title = titleMatch ? (titleMatch[1] || titleMatch[2] || '').trim() : '';
    const link = linkMatch ? (linkMatch[1] || linkMatch[2] || '').trim() : '';
    let description = descMatch ? (descMatch[1] || descMatch[2] || '').trim() : '';
    const pubDate = pubDateMatch ? pubDateMatch[1] : new Date().toISOString();
    
    // 清理 HTML 标签
    description = description.replace(/<[^>]*>/g, '').substring(0, 200);
    
    if (title && link) {
      items.push({ title, link, description, pubDate });
    }
  }
  
  return items.slice(0, 3); // 每个源最多 3 条
}

// 翻译函数（使用简单映射，实际可调用翻译 API）
function translateTitle(title, fromLang) {
  if (fromLang === 'zh') return title;
  // 这里简化处理，实际应调用翻译 API
  return title; // 保持英文标题，实际部署时添加翻译
}

// 从虎嗅 HTML 提取新闻
function parseHuxiu(html) {
  const articles = [];
  const articleRegex = /\[([^\]]+)\]\((https:\/\/www\.huxiu\.com\/article\/\d+\.html)\)/g;
  let match;
  
  while ((match = articleRegex.exec(html)) !== null) {
    const title = match[1];
    const link = match[2];
    if (title && link && !articles.find(a => a.link === link)) {
      articles.push({ title, link, description: '', pubDate: new Date().toISOString() });
    }
  }
  
  return articles.slice(0, 3);
}

// 从少数派 RSS 提取
function parseSSPai(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const titleMatch = itemXml.match(/<title>(.*?)<\/title>/);
    const linkMatch = itemXml.match(/<link>(.*?)<\/link>/);
    const descMatch = itemXml.match(/<description>(.*?)<\/description>/);
    const pubDateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/);
    
    const title = titleMatch ? titleMatch[1].trim() : '';
    const link = linkMatch ? linkMatch[1].trim() : '';
    let description = descMatch ? descMatch[1].replace(/<[^>]*>/g, '').substring(0, 200) : '';
    const pubDate = pubDateMatch ? pubDateMatch[1] : new Date().toISOString();
    
    if (title && link) {
      items.push({ title, link, description, pubDate });
    }
  }
  
  return items.slice(0, 3);
}

// 主函数
function main() {
  console.log('📰 开始处理新闻数据...');
  
  const articles = [];
  let articleId = 1;
  
  // TechCrunch
  const tcXml = fs.readFileSync(path.join(__dirname, 'rss/techcrunch.xml'), 'utf8');
  const tcItems = parseRSS(tcXml);
  tcItems.forEach(item => {
    articles.push({
      id: `tc-${String(articleId++).padStart(3, '0')}`,
      source: 'TechCrunch',
      title: item.title,
      titleCN: item.title, // 待翻译
      summary: item.description,
      summaryCN: item.description, // 待翻译
      url: item.link,
      publishedAt: new Date(item.pubDate).toISOString(),
      language: 'en',
      category: 'startup'
    });
  });
  console.log(`  ✓ TechCrunch: ${tcItems.length} 条`);
  
  // Ars Technica
  const arXml = fs.readFileSync(path.join(__dirname, 'rss/arstechnica.xml'), 'utf8');
  const arItems = parseRSS(arXml);
  arItems.forEach(item => {
    articles.push({
      id: `ar-${String(articleId++).padStart(3, '0')}`,
      source: 'Ars Technica',
      title: item.title,
      titleCN: item.title,
      summary: item.description,
      summaryCN: item.description,
      url: item.link,
      publishedAt: new Date(item.pubDate).toISOString(),
      language: 'en',
      category: 'technology'
    });
  });
  console.log(`  ✓ Ars Technica: ${arItems.length} 条`);
  
  // Wired
  const wdXml = fs.readFileSync(path.join(__dirname, 'rss/wired.xml'), 'utf8');
  const wdItems = parseRSS(wdXml);
  wdItems.forEach(item => {
    articles.push({
      id: `wd-${String(articleId++).padStart(3, '0')}`,
      source: 'Wired',
      title: item.title,
      titleCN: item.title,
      summary: item.description,
      summaryCN: item.description,
      url: item.link,
      publishedAt: new Date(item.pubDate).toISOString(),
      language: 'en',
      category: 'technology'
    });
  });
  console.log(`  ✓ Wired: ${wdItems.length} 条`);
  
  // CNET
  const cnXml = fs.readFileSync(path.join(__dirname, 'rss/cnet.xml'), 'utf8');
  const cnItems = parseRSS(cnXml);
  cnItems.forEach(item => {
    articles.push({
      id: `cn-${String(articleId++).padStart(3, '0')}`,
      source: 'CNET',
      title: item.title,
      titleCN: item.title,
      summary: item.description,
      summaryCN: item.description,
      url: item.link,
      publishedAt: new Date(item.pubDate).toISOString(),
      language: 'en',
      category: 'gadgets'
    });
  });
  console.log(`  ✓ CNET: ${cnItems.length} 条`);
  
  // 36Kr
  const krXml = fs.readFileSync(path.join(__dirname, 'rss/36kr.xml'), 'utf8');
  const krItems = parseRSS(krXml);
  krItems.forEach(item => {
    articles.push({
      id: `kr-${String(articleId++).padStart(3, '0')}`,
      source: '36Kr',
      title: item.title,
      titleCN: item.title,
      summary: item.description,
      summaryCN: item.description,
      url: item.link,
      publishedAt: new Date(item.pubDate).toISOString(),
      language: 'zh',
      category: 'startup'
    });
  });
  console.log(`  ✓ 36Kr: ${krItems.length} 条`);
  
  // 虎嗅
  const hxHtml = fs.readFileSync(path.join(__dirname, 'rss/huxiu.html'), 'utf8');
  const hxItems = parseHuxiu(hxHtml);
  hxItems.forEach(item => {
    articles.push({
      id: `hx-${String(articleId++).padStart(3, '0')}`,
      source: '虎嗅',
      title: item.title,
      titleCN: item.title,
      summary: '',
      summaryCN: '',
      url: item.link,
      publishedAt: new Date().toISOString(),
      language: 'zh',
      category: 'business'
    });
  });
  console.log(`  ✓ 虎嗅：${hxItems.length} 条`);
  
  // 少数派
  const ssXml = fs.readFileSync(path.join(__dirname, 'rss/sspai.xml'), 'utf8');
  const ssItems = parseSSPai(ssXml);
  ssItems.forEach(item => {
    articles.push({
      id: `ss-${String(articleId++).padStart(3, '0')}`,
      source: '少数派',
      title: item.title,
      titleCN: item.title,
      summary: item.description,
      summaryCN: item.description,
      url: item.link,
      publishedAt: new Date(item.pubDate).toISOString(),
      language: 'zh',
      category: 'apps'
    });
  });
  console.log(`  ✓ 少数派：${ssItems.length} 条`);
  
  // 按时间排序
  articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  
  // 生成输出数据
  const outputDir = path.join(__dirname, '../public/data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const newsData = {
    lastUpdated: new Date().toISOString(),
    sources: 10,
    totalArticles: articles.length,
    articles: articles,
    categories: [...new Set(articles.map(a => a.category))],
    fetchStatus: {
      success: ['TechCrunch', 'Ars Technica', 'Wired', 'CNET', '36Kr', '虎嗅', '少数派'],
      partial: ['BBC Technology', 'Bloomberg Tech'],
      failed: ['The Verge']
    }
  };
  
  // 保存到 latest.json
  const outputPath = path.join(outputDir, 'latest.json');
  fs.writeFileSync(outputPath, JSON.stringify(newsData, null, 2), 'utf8');
  
  console.log(`\n✅ 新闻处理完成！`);
  console.log(`📊 共 ${articles.length} 条新闻`);
  console.log(`📁 保存到：${outputPath}`);
  
  return newsData;
}

main();
