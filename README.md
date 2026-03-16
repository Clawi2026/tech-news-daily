# 🌍 全球科技日报

每日自动更新全球科技新闻，自动翻译为中文。

## 功能特点

- ✅ 覆盖全球 10+ 科技媒体（TechCrunch, HackerNews, The Verge, 36Kr, 虎嗅等）
- ✅ 英文新闻自动翻译为中文
- ✅ 每日自动更新（GitHub Actions）
- ✅ 免费 HTTPS（Vercel）
- ✅ 响应式设计，支持手机/电脑

## 快速部署

### 1. 部署到 Vercel（免费 HTTPS）

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录 Vercel
vercel login

# 部署
vercel
```

或者：

1. 访问 https://vercel.com/new
2. 导入此 GitHub 仓库
3. 点击 Deploy
4. 获得免费 HTTPS 链接（如：`https://your-project.vercel.app`）

### 2. 购买并绑定域名（可选）

1. 访问 https://namecheap.com 或 https://aliyun.com
2. 购买喜欢的域名（约 $10/年）
3. 在 Vercel 项目设置中添加自定义域名
4. 按提示配置 DNS

### 3. 设置自动更新

GitHub Actions 已配置，每日北京时间 8:00 自动抓取新闻。

也可手动触发：
- 访问 GitHub 仓库 → Actions → Daily News Fetch → Run workflow

## 本地开发

```bash
npm install
npm run dev
```

访问 http://localhost:3000

## 新闻源

### 英文媒体（自动翻译）
- TechCrunch
- HackerNews
- The Verge
- Ars Technica
- BBC Technology

### 中文媒体
- 36Kr
- 虎嗅
- 少数派

## 技术栈

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- GitHub Actions
- Vercel

## License

MIT
