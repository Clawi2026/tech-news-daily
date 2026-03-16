#!/bin/bash
# 本地抓取新闻脚本（无需 GitHub Actions）

cd /home/admin/openclaw/workspace/tech-news-daily

echo "📰 开始抓取全球科技新闻..."
echo "   新闻源：10 个（7 个国外 + 3 个国内）"

# 安装依赖
npm install playwright tsx --save

# 运行抓取脚本
npx playwright install chromium --with-deps
npx tsx scripts/fetch-news-browser.ts

echo ""
echo "✅ 新闻抓取完成！"
echo "📁 数据文件：public/data/latest.json"
echo ""
echo "🚀 现在部署到 Vercel..."
vercel deploy --prod --token=$VERCEL_TOKEN --yes

echo ""
echo "✨ 完成！访问 https://tech-news-daily.vercel.app"
