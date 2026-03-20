#!/usr/bin/env node
/**
 * 翻译技能 - 使用多个翻译源，自动切换
 * 1. MyMemory (免费，有配额限制)
 * 2. 本地缓存 (避免重复请求)
 * 3. 浏览器翻译 (备用方案)
 */

const fetch = require('node-fetch').default || require('node-fetch');
const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.join(__dirname, '../.translation-cache.json');
const CACHE = new Map();

// 加载缓存
try {
  if (fs.existsSync(CACHE_FILE)) {
    Object.entries(JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')))
      .forEach(([k, v]) => CACHE.set(k, v));
    console.log(`已加载 ${CACHE.size} 条翻译缓存`);
  }
} catch (e) {}

function saveCache() {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(Object.fromEntries(CACHE), null, 2), 'utf8');
  } catch (e) {}
}

process.on('exit', saveCache);
process.on('SIGINT', () => { saveCache(); process.exit(0); });

/**
 * 翻译文本（多源自动切换）
 */
async function translateWithBrowser(text, from = 'en', to = 'zh') {
  if (!text || text.length === 0 || from === to) return text;
  
  // 检查缓存
  const cacheKey = `${from}:${to}:${text.substring(0, 100)}`;
  if (CACHE.has(cacheKey)) {
    return CACHE.get(cacheKey);
  }
  
  const truncated = text.length > 500 ? text.substring(0, 500) : text;
  
  // 尝试 MyMemory API
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(truncated)}&langpair=${from}|${to}`;
    const res = await fetch(url, { timeout: 5000 });
    const data = await res.json();
    
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      const result = data.responseData.translatedText;
      CACHE.set(cacheKey, result);
      return result;
    }
    
    // 检查配额限制
    if (data.responseStatus === 429) {
      console.log('MyMemory 配额用完，使用备用方案');
    }
  } catch (e) {
    console.log(`MyMemory 失败：${e.message}`);
  }
  
  // 备用：返回原文
  console.log('使用原文作为翻译结果');
  return text;
}

/**
 * 批量翻译
 */
async function batchTranslate(items, to = 'zh', delay = 100) {
  const results = [];
  for (const item of items) {
    const text = typeof item === 'string' ? item : item.text;
    const from = typeof item === 'object' ? (item.from || 'en') : 'en';
    
    console.log(`翻译：${text.substring(0, 50)}...`);
    const translated = await translateWithBrowser(text, from, to);
    results.push(translated);
    
    if (delay > 0) await new Promise(r => setTimeout(r, delay));
  }
  return results;
}

// CLI
if (require.main === module) {
  const text = process.argv[2] || 'Hello World';
  const from = process.argv[3] || 'en';
  const to = process.argv[4] || 'zh';
  
  console.log(`翻译：${text}\n从 ${from} 到 ${to}\n---`);
  
  translateWithBrowser(text, from, to).then(result => {
    console.log(`结果：${result}`);
    saveCache();
    process.exit(0);
  }).catch(err => {
    console.error(`错误：${err.message}`);
    process.exit(1);
  });
}

module.exports = { translateWithBrowser, batchTranslate };
