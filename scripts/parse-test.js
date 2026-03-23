const fs = require('fs');
const { Parser } = require('xml2js');

(async () => {
  try {
    const xml = fs.readFileSync('/tmp/nr/tc.xml', 'utf8');
    console.log('XML:', xml.length, 'bytes');
    
    const parser = new Parser();
    const result = await parser.parseStringPromise(xml);
    
    const items = result.rss.channel[0].item;
    console.log('Items:', items.length);
    
    const news = items.slice(0, 3).map(item => ({
      title: item.title[0],
      link: item.link[0],
      date: item.pubDate[0]
    }));
    
    fs.writeFileSync('/home/admin/openclaw/workspace/tech-news-daily/public/data/latest.json', JSON.stringify(news, null, 2));
    console.log('✅ Saved!');
    console.log(JSON.stringify(news[0], null, 2));
  } catch (e) {
    console.error('Error:', e.message);
  }
})();
