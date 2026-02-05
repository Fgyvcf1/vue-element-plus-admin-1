const http = require('http');

// 正确编码URL中的中文字符
const encodedCategory = encodeURIComponent('村组');
const options = {
  hostname: 'localhost',
  port: 3001,
  path: `/dictionaries?category=${encodedCategory}`,
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('=== API Response ===');
    console.log('Status Code:', res.statusCode);
    console.log('Response Body:', data);
  });
});

req.on('error', (error) => {
  console.error('Request Error:', error);
});

req.end();