#!/bin/bash
# 全球科技日报 - 一键部署脚本

set -e

echo "🌍 全球科技日报 - 部署脚本"
echo "================================"
echo ""

# 检查 Git
if ! command -v git &> /dev/null; then
    echo "❌ 未找到 Git，请先安装 Git"
    exit 1
fi
echo "✅ Git 已安装"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未找到 Node.js，请先安装 Node.js"
    exit 1
fi
echo "✅ Node.js 已安装"

# 检查 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "📦 安装 Vercel CLI..."
    npm install -g vercel
fi
echo "✅ Vercel CLI 已安装"

echo ""
echo "================================"
echo "📋 接下来需要你在 GitHub 创建仓库"
echo "================================"
echo ""
echo "1. 访问 https://github.com/new"
echo "2. 仓库名称：tech-news-daily"
echo "3.  visibility: Public（公开）"
echo "4. 点击 'Create repository'"
echo ""
read -p "完成后按回车继续..."

echo ""
echo "📤 推送代码到 GitHub..."
echo ""

# 获取 GitHub 用户名
read -p "请输入你的 GitHub 用户名：" GITHUB_USER

if [ -z "$GITHUB_USER" ]; then
    echo "❌ GitHub 用户名不能为空"
    exit 1
fi

REMOTE_URL="https://github.com/${GITHUB_USER}/tech-news-daily.git"

# 检查是否已有远程仓库
if git remote | grep -q origin; then
    git remote set-url origin $REMOTE_URL
else
    git remote add origin $REMOTE_URL
fi

# 重命名分支为 main
git branch -M main 2>/dev/null || true

# 推送
echo "推送到：$REMOTE_URL"
git push -u origin main --force

echo ""
echo "✅ 代码已推送到 GitHub!"
echo ""
echo "================================"
echo "🚀 部署到 Vercel"
echo "================================"
echo ""
echo "请选择部署方式："
echo "1. 自动部署（需要 Vercel 账号）"
echo "2. 手动部署（访问 vercel.com/new）"
echo ""
read -p "选择 (1/2): " DEPLOY_CHOICE

if [ "$DEPLOY_CHOICE" = "1" ]; then
    echo ""
    echo "🔐 登录 Vercel..."
    vercel login
    
    echo ""
    echo "📤 部署中..."
    vercel --prod
    
    echo ""
    echo "✅ 部署完成！"
else
    echo ""
    echo "📋 手动部署步骤："
    echo "1. 访问 https://vercel.com/new"
    echo "2. 用 GitHub 账号登录"
    echo "3. 导入 'tech-news-daily' 仓库"
    echo "4. 点击 Deploy"
    echo ""
fi

echo ""
echo "================================"
echo "🎉 部署完成！"
echo "================================"
echo ""
echo "你的网站将在以下地址访问："
echo "- Vercel 免费域名：https://tech-news-daily-${GITHUB_USER}.vercel.app"
echo ""
echo "详细说明请查看：DEPLOY.md"
echo ""
