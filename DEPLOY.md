# 🚀 部署指南

## 方案一：Vercel 一键部署（推荐，5 分钟上线）

### 步骤 1: 创建 GitHub 仓库

```bash
# 在 GitHub 创建新仓库（名称如：tech-news-daily）
# 然后推送代码：
git remote add origin https://github.com/YOUR_USERNAME/tech-news-daily.git
git branch -M main
git push -u origin main
```

### 步骤 2: 部署到 Vercel

**方法 A：网页部署（最简单）**

1. 访问 https://vercel.com/new
2. 点击 "Continue with GitHub" 登录
3. 点击 "Import Git Repository"
4. 选择刚才创建的 `tech-news-daily` 仓库
5. 点击 "Deploy"
6. 等待 1-2 分钟，获得 HTTPS 链接（如：`https://tech-news-daily-xxx.vercel.app`）

**方法 B：CLI 部署**

```bash
npm install -g vercel
vercel login
cd /home/admin/openclaw/workspace/tech-news-daily
vercel
```

### 步骤 3: 设置自动更新

GitHub Actions 已配置好，每日北京时间 8:00 自动运行。

如需手动触发：
1. 访问 GitHub 仓库
2. 点击 "Actions" 标签
3. 选择 "Daily News Fetch"
4. 点击 "Run workflow"

### 步骤 4: 绑定自定义域名（可选）

1. 购买域名（推荐 https://namecheap.com）
   - 推荐后缀：.com / .io / .tech / .news
   - 价格：约 $10-15/年

2. 在 Vercel 项目设置中添加域名：
   - 进入 Vercel 项目 → Settings → Domains
   - 输入你的域名（如：technews-daily.com）
   - 点击 "Add"

3. 配置 DNS（在域名注册商处）：
   ```
   类型：CNAME
   名称：@ 或 www
   值：cname.vercel-dns.com
   ```

4. 等待 DNS 生效（通常 5-30 分钟）
5. Vercel 自动配置 HTTPS 证书（Let's Encrypt，免费自动续期）

---

## 方案二：Netlify 部署（备选）

1. 访问 https://netlify.com
2. 登录并点击 "Add new site" → "Import an existing project"
3. 连接 GitHub 并选择仓库
4. 构建设置：
   - Build command: `npm run build`
   - Publish directory: `.next`
5. 点击 "Deploy site"

---

## 验证部署

部署完成后，访问你的 HTTPS 链接，应该看到：

- ✅ 网站正常加载
- ✅ 显示 8 条演示新闻
- ✅ 来源标签颜色正确
- ✅ 点击"阅读原文"跳转到原新闻
- ✅ 手机端显示正常

---

## 后续维护

### 添加新闻源

编辑 `scripts/fetch-news.ts` 中的 `NEWS_SOURCES` 数组，添加新的 RSS 源。

### 修改更新频率

编辑 `.github/workflows/daily-news.yml` 中的 cron 表达式：
```yaml
schedule:
  - cron: '0 0 * * *'  # 每天 UTC 0:00（北京时间 8:00）
```

### 查看自动更新日志

GitHub → Actions → Daily News Fetch → 查看每次运行记录

---

## 费用说明

| 项目 | 费用 | 说明 |
|------|------|------|
| Vercel 托管 | 免费 | 个人项目免费额度足够 |
| HTTPS 证书 | 免费 | Let's Encrypt 自动续期 |
| GitHub Actions | 免费 | 每月 2000 分钟额度 |
| 域名 | ~$10/年 | 唯一需要付费的项目 |
| **总计** | **~$10/年** | 仅域名费用 |

---

## 获取帮助

遇到问题？
- Vercel 文档：https://vercel.com/docs
- Next.js 文档：https://nextjs.org/docs
- GitHub Actions：https://docs.github.com/actions
