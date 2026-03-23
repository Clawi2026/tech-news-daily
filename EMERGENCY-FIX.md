# 🔴 紧急修复说明 (2026-03-23)

## 问题
网站出现 "Application error: a client-side exception has occurred" 错误

## 原因
The Verge RSS 源的 title 字段格式特殊（对象格式而非字符串），导致前端渲染失败

## 已修复
✅ 数据文件已修复 (`public/data/latest.json`)
✅ 修复脚本已创建

## 部署方案

### 方案 1: Vercel 网页部署（推荐）
1. 访问 https://vercel.com/dashboard
2. 找到 `tech-news-daily` 项目
3. 点击 "Redeploy" 或手动上传修复后的数据

### 方案 2: 使用 Vercel Token 部署
```bash
# 获取 Vercel Token: https://vercel.com/account/tokens
export VERCEL_TOKEN="你的 token"
cd /home/admin/openclaw/workspace/tech-news-daily
vercel deploy --prod --token=$VERCEL_TOKEN --yes
```

### 方案 3: GitHub Actions（需要配置 secret）
1. 访问 https://github.com/Clawi2026/tech-news-daily/settings/secrets/actions
2. 添加 `VERCEL_TOKEN` secret
3. 推送代码或手动触发 workflow

## 临时方案
如果无法立即部署，可以：
1. 下载修复后的 `public/data/latest.json`
2. 通过 Vercel Dashboard 手动上传

## 修复脚本
```bash
cd /home/admin/openclaw/workspace/tech-news-daily
node -e "
const fs = require('fs');
let data = JSON.parse(fs.readFileSync('public/data/latest.json', 'utf8'));
data = data.map(item => ({
  ...item,
  title: typeof item.title === 'object' ? (item.title._ || '') : item.title,
  originalTitle: typeof item.originalTitle === 'object' ? (item.originalTitle._ || '') : item.originalTitle
}));
fs.writeFileSync('public/data/latest.json', JSON.stringify(data, null, 2));
console.log('Fixed!');
"
```

## 预防措施
已在 `fetch-now.sh` 脚本中添加格式修复逻辑，确保所有 title 字段都是字符串
