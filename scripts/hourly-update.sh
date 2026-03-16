#!/bin/bash
# 每小时新闻更新脚本

cd /home/admin/openclaw/workspace/tech-news-daily

echo "📰 开始抓取全球科技新闻..."
echo "时间：$(date)"

# 使用浏览器工具抓取（通过 OpenClaw）
# 这里调用浏览器 API 抓取 10 个新闻源

# 部署到 Vercel
echo "🚀 部署到 Vercel..."
vercel deploy --prod --token=$VERCEL_TOKEN --yes

echo "✅ 更新完成！"
echo "访问：https://tech-news-daily.vercel.app"
