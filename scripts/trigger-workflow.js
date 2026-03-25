const https = require('https');

const token = process.env.GITHUB_TOKEN || 'GITHUB_TOKEN_PLACEHOLDER';
const owner = 'Clawi2026';
const repo = 'tech-news-daily';

// 首先推送代码
const pushOptions = {
  hostname: 'api.github.com',
  path: `/repos/${owner}/${repo}/git/refs/heads/main`,
  method: 'PATCH',
  headers: {
    'Accept': 'application/vnd.github+json',
    'Authorization': `token ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'Node.js-Deploy',
    'Content-Type': 'application/json'
  }
};

// 触发 workflow
const workflowOptions = {
  hostname: 'api.github.com',
  path: `/repos/${owner}/${repo}/actions/workflows/vercel-deploy.yml/dispatches`,
  method: 'POST',
  headers: {
    'Accept': 'application/vnd.github+json',
    'Authorization': `token ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'Node.js-Deploy',
    'Content-Type': 'application/json'
  }
};

console.log('触发 Vercel 部署 workflow...');

const req = https.request(workflowOptions, (res) => {
  console.log('Status:', res.statusCode);
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    if (res.statusCode === 204) {
      console.log('✅ Workflow 触发成功！');
      console.log('请访问 https://github.com/Clawi2026/tech-news-daily/actions 查看部署进度');
    } else {
      console.log('Response:', body);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Error:', e.message);
  console.log('\n请手动推送代码:');
  console.log('cd /home/admin/openclaw/workspace/tech-news-daily');
  console.log('git push origin main');
});

req.write(JSON.stringify({ ref: 'main' }));
req.end();
