# 🔄 自动更新配置说明

## ⏰ 更新频率

**每小时整点自动更新**（北京时间）

- Cron 表达式：`0 * * * *`
- 时区：Asia/Shanghai
- 下次运行：每个小时的 00 分

---

## 📰 新闻源（10 个）

### 国外媒体（7 个）
1. **TechCrunch** - https://techcrunch.com
2. **The Verge** - https://www.theverge.com
3. **Ars Technica** - https://arstechnica.com
4. **Wired** - https://www.wired.com
5. **BBC Technology** - https://www.bbc.com/news/technology
6. **CNET** - https://www.cnet.com
7. **Bloomberg Tech** - https://www.bloomberg.com/technology

### 国内媒体（3 个）
8. **36Kr** - https://www.36kr.com
9. **虎嗅** - https://www.huxiu.com
10. **少数派** - https://sspai.com

---

## 🔧 更新流程

### 自动更新（每小时）

1. **触发** - Cron 任务在整点触发
2. **抓取** - 使用浏览器访问 10 个新闻源
3. **提取** - 抓取最新 2-3 条新闻
4. **翻译** - 英文新闻自动翻译为中文
5. **保存** - 更新 `public/data/latest.json`
6. **部署** - 自动部署到 Vercel

### 手动更新（随时）

```bash
cd /home/admin/openclaw/workspace/tech-news-daily

# 运行抓取脚本
node scripts/auto-fetch.js

# 部署到 Vercel
vercel deploy --prod --token=$VERCEL_TOKEN --yes
```

---

## 📊 数据格式

```json
[
  {
    "id": "unique_id",
    "title": "中文标题",
    "originalTitle": "Original Title",
    "description": "新闻摘要",
    "link": "https://...",
    "source": "TechCrunch",
    "category": "科技创业",
    "language": "en",
    "publishedAt": "2026-03-16T14:00:00Z",
    "fetchedAt": "2026-03-16T14:00:00Z"
  }
]
```

---

## 🌐 访问链接

**HTTPS 链接**: https://tech-news-daily.vercel.app

---

## ⚙️ 配置管理

### 查看 Cron 状态
```bash
openclaw cron list
```

### 手动触发更新
```bash
openclaw cron run --id=<job-id>
```

### 修改更新频率
编辑 cron 任务的 schedule.expr：
- 每 30 分钟：`*/30 * * * *`
- 每 2 小时：`0 */2 * * *`
- 每天 8 点：`0 8 * * *`

---

## 📝 注意事项

1. **浏览器缓存** - 每次抓取使用新页面，避免缓存
2. **反爬虫** - 部分网站可能有反爬机制，抓取失败会自动跳过
3. **翻译限制** - 免费翻译 API 有调用限制，大批量可能失败
4. **部署时间** - Vercel 部署约需 30-60 秒

---

## 🆘 故障排查

### 抓取失败
检查浏览器是否可用：
```bash
openclaw browser status
```

### 部署失败
检查 Vercel Token 是否有效：
```bash
vercel whoami --token=<token>
```

### 数据未更新
检查数据文件：
```bash
cat public/data/latest.json | head -20
```

---

**最后更新**: 2026-03-16 23:00
**下次更新**: 2026-03-17 00:00
