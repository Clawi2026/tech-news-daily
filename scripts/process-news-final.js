#!/usr/bin/env node
/**
 * 处理新闻：翻译英文 + 添加 metadata
 */

const fetch = require('node-fetch').default || require('node-fetch');
const fs = require('fs');
const path = require('path');

// 翻译 API - 使用 LibreTranslate
async function translateText(text, from = 'en', to = 'zh') {
  if (from === 'zh' || !text || text.length === 0) return text;
  try {
    const truncated = text.length > 500 ? text.substring(0, 500) : text;
    // 尝试 LibreTranslate 公共实例
    const url = 'https://translate.terraprint.co/translate';
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: truncated,
        source: from,
        target: to,
        format: 'text'
      }),
      timeout: 8000
    });
    const data = await response.json();
    if (data?.translatedText) {
      return data.translatedText;
    }
    // 回退到 MyMemory
    const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(truncated)}&langpair=${from}|${to}`;
    const mmResponse = await fetch(myMemoryUrl, { timeout: 5000 });
    const mmData = await mmResponse.json();
    if (mmData.responseStatus === 200 && mmData.responseData?.translatedText) {
      return mmData.responseData.translatedText;
    }
    return text;
  } catch (error) {
    return text;
  }
}

async function main() {
  const inputPath = path.join(__dirname, '../public/data/latest.json');
  const outputPath = path.join(__dirname, '../../public/data/latest.json');
  
  console.log('📰 处理新闻数据...');
  console.log(`   输入：${inputPath}`);
  console.log(`   输出：${outputPath}`);
  console.log('');
  
  // 读取数据
  const articles = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  console.log(`📊 读取到 ${articles.length} 条新闻`);
  
  // 翻译英文新闻
  const translatedArticles = [];
  for (const article of articles) {
    if (article.language === 'en') {
      console.log(`  → 翻译：${article.source} - ${article.originalTitle.substring(0, 50)}...`);
      const [translatedTitle, translatedSummary] = await Promise.all([
        translateText(article.originalTitle, 'en', 'zh'),
        translateText(article.originalSummary, 'en', 'zh')
      ]);
      console.log(`     标题：${translatedTitle.substring(0, 50)}...`);
      translatedArticles.push({
        ...article,
        title: translatedTitle,
        summary: translatedSummary.substring(0, 200),
        language: 'zh' // 标记为已翻译
      });
    } else {
      translatedArticles.push(article);
    }
  }
  
  // 统计
  const sourceStats = {};
  translatedArticles.forEach(n => {
    sourceStats[n.source] = (sourceStats[n.source] || 0) + 1;
  });
  
  // 添加 metadata
  const outputData = {
    lastUpdated: new Date().toISOString(),
    sources: 10,
    totalArticles: translatedArticles.length,
    fetchStatus: {
      success: Object.keys(sourceStats),
      partial: [],
      failed: ['BBC Technology', 'Bloomberg Tech', '虎嗅']
    },
    articles: translatedArticles.slice(0, 30) // 最多 30 条
  };
  
  // 确保输出目录存在
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // 保存
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf8');
  
  console.log('');
  console.log('✅ 处理完成！');
  console.log(`📁 保存到：${outputPath}`);
  console.log(`📊 总计：${outputData.totalArticles} 条新闻`);
  console.log('📊 新闻源统计:');
  Object.entries(sourceStats).forEach(([source, count]) => {
    console.log(`   ${source}: ${count} 条`);
  });
  
  return outputData;
}

main().catch(console.error);
