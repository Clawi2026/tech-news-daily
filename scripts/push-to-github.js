const https = require('https');
const fs = require('fs');

const token = process.env.GITHUB_TOKEN || 'GITHUB_TOKEN_PLACEHOLDER';
const owner = 'Clawi2026';
const repo = 'tech-news-daily';

// 读取需要推送的文件
const latestJson = fs.readFileSync('public/data/latest.json', 'utf8');
const todayJson = fs.readFileSync('public/data/2026-03-23.json', 'utf8');

// GitHub API: 更新文件
function updateFile(path, content, message) {
  return new Promise((resolve, reject) => {
    // 先获取当前 SHA
    const getOptions = {
      hostname: 'api.github.com',
      path: `/repos/${owner}/${repo}/contents/${path}`,
      method: 'GET',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `token ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'Node.js'
      }
    };

    https.get(getOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const file = JSON.parse(data);
          const sha = file.sha;
          
          // 更新文件
          const putData = JSON.stringify({
            message,
            content: Buffer.from(content).toString('base64'),
            sha
          });
          
          const putOptions = {
            hostname: 'api.github.com',
            path: `/repos/${owner}/${repo}/contents/${path}`,
            method: 'PUT',
            headers: {
              'Accept': 'application/vnd.github+json',
              'Authorization': `token ${token}`,
              'X-GitHub-Api-Version': '2022-11-28',
              'User-Agent': 'Node.js',
              'Content-Type': 'application/json',
              'Content-Length': putData.length
            }
          };
          
          const req = https.request(putOptions, (res2) => {
            let body = '';
            res2.on('data', chunk => body += chunk);
            res2.on('end', () => {
              if (res2.statusCode === 201) {
                resolve('Created');
              } else if (res2.statusCode === 200) {
                resolve('Updated');
              } else {
                reject(new Error(`Status ${res2.statusCode}: ${body}`));
              }
            });
          });
          req.on('error', reject);
          req.write(putData);
          req.end();
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

(async () => {
  try {
    console.log('📤 推送数据文件到 GitHub...');
    await updateFile('public/data/latest.json', latestJson, 'fix: 修复新闻数据格式 (2026-03-23)');
    console.log('✅ latest.json 推送成功');
    
    await updateFile('public/data/2026-03-23.json', todayJson, 'fix: 添加今日新闻数据');
    console.log('✅ 2026-03-23.json 推送成功');
    
    console.log('\n✅ 文件已推送到 GitHub!');
    console.log('Vercel 将自动部署，请访问: https://github.com/Clawi2026/tech-news-daily/actions');
  } catch (e) {
    console.error('❌ Error:', e.message);
    console.log('\n请手动推送或检查 token 权限');
  }
})();
