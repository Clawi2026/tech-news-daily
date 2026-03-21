#!/usr/bin/env node
/**
 * 翻译模块 - 集成多个翻译源
 * 1. 本地 translate-fast.sh 脚本（MyMemory API）
 * 2. MyMemory API 直接调用
 * 3. 百度翻译 API（如果配置）
 * 4. 缓存机制
 */

const { exec } = require('child_process');
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
    console.log(`✓ 已加载 ${CACHE.size} 条翻译缓存`);
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
 * 方法 1: 使用本地翻译脚本
 */
async function translateWithLocalScript(text, from = 'en', to = 'zh') {
  return new Promise((resolve) => {
    const scriptPath = path.join(__dirname, '../../.openclaw/skills/translation/scripts/translate-fast.sh');
    const cmd = `${scriptPath} "${text.replace(/"/g, '\\"')}" ${from} ${to}`;
    
    exec(cmd, { timeout: 8000 }, (error, stdout, stderr) => {
      if (error || stderr) {
        resolve(null); // 失败则尝试其他方法
      } else {
        const result = stdout.trim();
        if (result && result !== '翻译失败') {
          resolve(result);
        } else {
          resolve(null);
        }
      }
    });
  });
}

/**
 * 方法 2: MyMemory API 直接调用
 */
async function translateWithMyMemory(text, from = 'en', to = 'zh') {
  try {
    const truncated = text.length > 500 ? text.substring(0, 500) : text;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(truncated)}&langpair=${from}|${to}`;
    const response = await fetch(url, { timeout: 8000 });
    const data = await response.json();
    
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return data.responseData.translatedText;
    }
    
    // 检查配额限制
    if (data.responseStatus === 429) {
      console.log('⚠ MyMemory 配额用完');
    }
    
    return null;
  } catch (e) {
    console.log(`⚠ MyMemory 失败：${e.message}`);
    return null;
  }
}

/**
 * 方法 3: 百度翻译 API（如果配置了）
 */
async function translateWithBaidu(text, from = 'en', to = 'zh') {
  const appId = process.env.BAIDU_APP_ID;
  const secretKey = process.env.BAIDU_SECRET_KEY;
  
  if (!appId || !secretKey) {
    return null; // 未配置
  }
  
  try {
    const crypto = require('crypto');
    const salt = Date.now().toString();
    const sign = crypto.createHash('md5')
      .update(appId + text + salt + secretKey)
      .digest('hex');
    
    const url = `https://fanyi-api.baidu.com/api/trans/vip/translate?q=${encodeURIComponent(text)}&from=${from}&to=${to}&appid=${appId}&salt=${salt}&sign=${sign}`;
    const response = await fetch(url, { timeout: 8000 });
    const data = await response.json();
    
    if (data.trans_result && data.trans_result[0]?.dst) {
      return data.trans_result[0].dst;
    }
    
    return null;
  } catch (e) {
    console.log(`⚠ 百度翻译失败：${e.message}`);
    return null;
  }
}

/**
 * 主翻译函数 - 自动选择最佳源
 */
async function translateText(text, from = 'en', to = 'zh') {
  // 不需要翻译的情况
  if (!text || text.length === 0) return text;
  if (from === to || from === 'zh' || from === 'zh-CN') return text;
  
  // 检查缓存
  const cacheKey = `${from}:${to}:${text.substring(0, 100)}`;
  if (CACHE.has(cacheKey)) {
    return CACHE.get(cacheKey);
  }
  
  console.log(`🔄 翻译：${text.substring(0, 50)}...`);
  
  // 尝试顺序：本地脚本 → MyMemory → 百度翻译 → 原文
  let result = null;
  
  // 1. 本地翻译脚本
  result = await translateWithLocalScript(text, from, to);
  if (result) {
    console.log(`✓ 翻译成功 (本地脚本)`);
    CACHE.set(cacheKey, result);
    return result;
  }
  
  // 2. MyMemory API
  result = await translateWithMyMemory(text, from, to);
  if (result) {
    console.log(`✓ 翻译成功 (MyMemory)`);
    CACHE.set(cacheKey, result);
    return result;
  }
  
  // 3. 百度翻译
  result = await translateWithBaidu(text, from, to);
  if (result) {
    console.log(`✓ 翻译成功 (百度翻译)`);
    CACHE.set(cacheKey, result);
    return result;
  }
  
  // 都失败，返回原文
  console.log(`⚠ 所有翻译失败，使用原文`);
  return text;
}

/**
 * 批量翻译
 */
async function batchTranslate(items, to = 'zh', delay = 200) {
  const results = [];
  let successCount = 0;
  let failCount = 0;
  
  for (const item of items) {
    const text = typeof item === 'string' ? item : item.text;
    const from = typeof item === 'object' ? (item.from || 'en') : 'en';
    
    const translated = await translateText(text, from, to);
    results.push(translated);
    
    if (translated !== text) {
      successCount++;
    } else {
      failCount++;
    }
    
    // 避免触发 API 限流
    if (delay > 0) {
      await new Promise(r => setTimeout(r, delay));
    }
  }
  
  console.log(`📊 翻译统计：成功 ${successCount}, 失败 ${failCount}`);
  return results;
}

// CLI 模式
if (require.main === module) {
  const text = process.argv[2] || 'Hello World';
  const from = process.argv[3] || 'en';
  const to = process.argv[4] || 'zh';
  
  console.log(`翻译：${text}\n从 ${from} 到 ${to}\n---`);
  
  translateText(text, from, to).then(result => {
    console.log(`\n结果：${result}`);
    saveCache();
    process.exit(0);
  }).catch(err => {
    console.error(`错误：${err.message}`);
    process.exit(1);
  });
}

module.exports = { translateText, batchTranslate };
