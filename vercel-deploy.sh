#!/bin/bash
# Vercel 直接部署脚本（无需 GitHub）

cd /home/admin/openclaw/workspace/tech-news-daily

echo "🚀 开始 Vercel 部署..."

# 构建项目
echo "📦 构建项目..."
npm run build

echo ""
echo "⚠️  接下来需要登录 Vercel"
echo ""
echo "请按以下步骤操作："
echo "1. 访问 https://vercel.com/login"
echo "2. 登录你的账号"
echo "3. 访问 https://vercel.com/account/settings"
echo "4. 滚动到 'Access Tokens' 部分"
echo "5. 点击 'Create'"
echo "6. 输入名称如 'deploy-token'"
echo "7. 复制生成的 token"
echo ""
read -p "输入你的 Vercel Token: " VERCEL_TOKEN

if [ -z "$VERCEL_TOKEN" ]; then
    echo "❌ Token 不能为空"
    exit 1
fi

# 设置 token
export VERCEL_TOKEN

echo ""
echo "📤 部署到 Vercel..."
vercel deploy --prod --yes

echo ""
echo "✅ 部署完成！"
