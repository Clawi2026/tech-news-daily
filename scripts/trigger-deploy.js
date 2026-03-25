const https = require('https');

const token = process.env.GITHUB_TOKEN || 'GITHUB_TOKEN_PLACEHOLDER';
const owner = 'Clawi2026';
const repo = 'tech-news-daily';

const options = {
  hostname: 'api.github.com',
  path: `/repos/${owner}/${repo}/actions/workflows/vercel-deploy.yml/dispatches`,
  method: 'POST',
  headers: {
    'Accept': 'application/vnd.github+json',
    'Authorization': `token ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'Node.js'
  }
};

const req = https.request(options, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => console.log('Response:', body));
});

req.on('error', (e) => console.error('Error:', e.message));
req.write(JSON.stringify({ ref: 'main' }));
req.end();
