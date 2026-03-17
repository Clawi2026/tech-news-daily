# 翻译 API 配置说明

## 🎯 推荐方案：百度翻译 API

### 免费额度
- **标准版**：200 万字符/月（免费）
- **并发**：10 QPS
- **支持语言**：中英互译等 200+ 语言

### 注册步骤

1. **访问百度翻译开放平台**
   - 网址：https://fanyi-api.baidu.com/product/11
   - 使用百度账号登录

2. **开通翻译服务**
   - 点击"管理控制台"
   - 点击"开通服务"
   - 选择"标准版"（免费）

3. **获取 API 密钥**
   - 在控制台找到"开发者信息"
   - 记录 `APP ID` 和 `密钥 (Secret Key)`

4. **配置环境变量**

   在项目根目录创建 `.env` 文件：
   ```bash
   # 百度翻译 API
   BAIDU_APP_ID=你的 APP_ID
   BAIDU_SECRET_KEY=你的密钥
   ```

   或者在 Vercel 中配置：
   - 访问 https://vercel.com/dashboard
   - 进入项目 Settings → Environment Variables
   - 添加 `BAIDU_APP_ID` 和 `BAIDU_SECRET_KEY`

5. **测试翻译**
   ```bash
   cd /home/admin/openclaw/workspace/tech-news-daily
   node scripts/fetch-news-curl.js
   ```

   查看输出中是否有 `✓ 翻译成功 (百度翻译)` 的日志

---

## 🔄 备用方案

如果百度翻译不可用，系统会自动切换到以下备用 API：

1. **MyMemory** - 1000 条/天（免费，但配额有限）
2. **LibreTranslate** - 多个公共实例（不稳定）

---

## 📊 翻译统计

脚本会输出翻译状态：
```
✓ 翻译成功 (百度翻译)
⚠ MyMemory 失败：配额用完
❌ 所有翻译 API 失败，使用原文
```

---

## 🛠️ 故障排查

### 问题 1：提示"未配置百度翻译 API"
**解决**：检查 `.env` 文件是否存在，或 Vercel 环境变量是否配置

### 问题 2：百度翻译返回错误
**解决**：
- 检查 APP ID 和密钥是否正确
- 确认账户是否已开通标准版服务
- 查看是否超过月度配额

### 问题 3：翻译速度慢
**解决**：百度翻译 API 响应通常在 1-3 秒，如持续超时检查网络连接

---

## 📝 其他可选 API

### DeepL API
- **免费额度**：50 万字符/月
- **质量**：最佳
- **注册**：https://www.deepl.com/pro-api
- **配置**：添加 `DEEPL_API_KEY` 环境变量

### Google Cloud Translation
- **免费额度**：50 万字符/月
- **质量**：优秀
- **注册**：https://cloud.google.com/translate
- **配置**：需要配置 Google Cloud 凭据

---

**最后更新**: 2026-03-17
