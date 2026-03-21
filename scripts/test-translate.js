#!/usr/bin/env node
/**
 * 测试翻译模块集成
 */

const { translateText } = require('./translate-module');

async function test() {
  console.log('=== 翻译模块集成测试 ===\n');
  
  const tests = [
    { text: 'Breaking: New AI Model Released', from: 'en', to: 'zh' },
    { text: 'Tech Giants Report Quarterly Earnings', from: 'en', to: 'zh' },
    { text: 'Startup Raises $100M in Series B', from: 'en', to: 'zh' },
  ];
  
  let success = 0;
  let failed = 0;
  
  for (const test of tests) {
    console.log(`原文：${test.text}`);
    const result = await translateText(test.text, test.from, test.to);
    console.log(`译文：${result}`);
    
    if (result !== test.text) {
      success++;
      console.log('✓ 翻译成功\n');
    } else {
      failed++;
      console.log('⚠ 使用原文\n');
    }
    
    // 避免触发限流
    await new Promise(r => setTimeout(r, 300));
  }
  
  console.log('=== 测试完成 ===');
  console.log(`成功：${success}, 失败：${failed}`);
}

test().catch(console.error);
