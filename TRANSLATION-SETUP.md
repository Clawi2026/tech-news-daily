# 🔤 翻译服务配置说明

## 📊 当前状态

**翻译服务**: ✅ Google 翻译小部件（免费）

**部署时间**: 2026-03-22

**现状**: 
- ✅ 右上角固定翻译按钮
- ✅ 支持中文简体/繁体、英文、日文、韩文
- ✅ 一键翻译整个页面
- ✅ 零成本，无需 API Key
- 英文新闻显示原文（带 🇬🇧 EN 标签）
- 中文新闻正常显示（带 🇨🇳 中文 标签）

---

## ✅ 当前方案：Google 翻译小部件

**优势**:
- ✅ 完全免费，无需注册
- ✅ 无需 API Key
- ✅ 支持 100+ 语言
- ✅ 一键翻译整个页面
- ✅ Google 翻译质量可靠

**使用方式**:
- 页面右上角固定显示翻译按钮
- 点击下拉菜单选择目标语言
- 自动翻译整个页面内容

**配置位置**: `app/page.tsx` 中的 `GoogleTranslateWidget` 组件

---

## 🔄 升级方案（可选）

如果未来需要更高质量的翻译，可以考虑：

### 方案 1: DeepL API ⭐⭐⭐⭐⭐

**优势**:
- 翻译质量最高（业界公认）
- 免费额度充足：50 万字符/月
- 技术术语准确

**成本**:
- 免费：50 万字符/月（约 1000 条新闻）
- 超额：$25/百万字符

**接入步骤**:
1. 访问 https://www.deepl.com/pro-api
2. 注册账号，获取 API Key
3. 设置环境变量：
   ```bash
   DEEPL_API_KEY=xxx:yyy
   ```
4. 修改 `scripts/auto-fetch.js` 中的 `translateText` 函数

**代码示例**:
```javascript
async function translateText(text, from, to = 'zh') {
  if (from === 'zh' || !text) return text;
  
  const response = await fetch('https://api-free.deepl.com/v2/translate', {
    method: 'POST',
    headers: {
      'Authorization': `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: [text.substring(0, 500)],
      target_lang: 'ZH'
    })
  });
  
  const data = await response.json();
  return data.translations?.[0]?.text || text;
}
```

---

### 方案 2: 阿里云机器翻译 ⭐⭐⭐⭐

**优势**:
- 国内访问速度快
- 中文翻译优化好
- 免费额度：100 万字符/月（新用户）

**成本**:
- 免费：100 万字符/月（新用户）
- 付费：¥45/百万字符

**接入步骤**:
1. 访问 https://www.aliyun.com/product/ai/alimt
2. 开通服务，获取 AccessKey
3. 设置环境变量：
   ```bash
   ALIBABA_CLOUD_ACCESS_KEY_ID=LTAI5t...
   ALIBABA_CLOUD_ACCESS_KEY_SECRET=xxx
   ```

---

### 方案 3: Google Cloud Translation ⭐⭐⭐⭐

**优势**:
- 支持 100+ 语言
- 质量稳定可靠
- 免费额度：50 万字符/月

**成本**:
- 免费：50 万字符/月
- 付费：$20/百万字符

**接入步骤**:
1. 访问 https://cloud.google.com/translate
2. 创建项目，启用 Translation API
3. 创建服务账号，下载 JSON Key
4. 设置环境变量：
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
   ```

---

### 方案 4: LibreTranslate 自建 ⭐⭐⭐

**优势**:
- 完全免费
- 无配额限制
- 开源可审计

**劣势**:
- 翻译质量一般
- 需要自己部署服务器

**部署方式**:
```bash
# Docker 部署
docker run -p 5000:5000 libretranslate/libretranslate

# 或使用公共实例（不稳定）
https://libretranslate.com/translate
```

---

## 📈 用量估算

按当前配置（每 8 小时更新，35 条新闻）：

| 项目 | 估算 |
|------|------|
| 每日新闻数 | 35 条 × 3 次 = 105 条 |
| 每日字符数 | 105 × 500 字符 = 52,500 字符 |
| 每月字符数 | 52,500 × 30 = **157.5 万字符** |

**推荐**: DeepL（50 万免费）+ 阿里云（100 万免费）组合使用

---

## 🚀 快速接入 DeepL（推荐）

### 1. 获取 API Key
访问：https://www.deepl.com/pro-api → 注册 → 获取 Key

### 2. 添加到环境变量
```bash
cd /home/admin/openclaw/workspace/tech-news-daily
echo "DEEPL_API_KEY=你的 API Key" >> .env
```

### 3. 修改翻译函数
编辑 `scripts/auto-fetch.js`，替换 `translateText` 函数（见上方代码示例）

### 4. 测试
```bash
node scripts/auto-fetch.js
```

### 5. 部署
```bash
vercel deploy --prod --token=$VERCEL_TOKEN --yes
```

---

## 📝 临时方案

在正式接入翻译 API 之前：

1. **英文内容显示原文** - 已实现（带 🇬🇧 EN 标签）
2. **浏览器翻译** - 用户可右键 → "翻译成中文"
3. **Chrome/Edge 自动翻译** - 浏览器会自动提示翻译

---

## 🆘 故障排查

### 翻译失败
检查日志：
```bash
tail -f logs/translation.log
```

### 配额超限
查看用量：
- DeepL: https://www.deepl.com/pro-account/usage
- 阿里云：https://usercenter2.aliyun.com/bill

### API 错误
检查网络：
```bash
curl -I https://api-free.deepl.com
```

---

## 📝 临时方案（已实现）

在正式接入翻译 API 之前：

1. **英文内容显示原文** - 已实现（带 🇬🇧 EN 标签）
2. **Google 翻译小部件** - 页面右上角固定按钮
3. **浏览器翻译** - 用户可右键 → "翻译成中文"
4. **Chrome/Edge 自动翻译** - 浏览器会自动提示翻译

---

**最后更新**: 2026-03-22
**当前状态**: ✅ Google 翻译小部件已上线
**下次升级**: 如需更高质量翻译，可接入 DeepL API
