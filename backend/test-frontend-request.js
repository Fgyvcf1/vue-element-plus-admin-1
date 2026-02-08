const http = require('http');

console.log('测试前端请求到后端API...\n');

const options = {
  hostname: 'localhost',
  port: 3002,
  path: '/api/residents',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';

  console.log(`状态码: ${res.statusCode}`);
  console.log(`响应头: ${JSON.stringify(res.headers)}\n`);

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('响应数据:');
      console.log(JSON.stringify(json, null, 2));

      if (json.code === 20000) {
        console.log('\n✓ API请求成功！');
        console.log(`- 总记录数: ${json.total}`);
        console.log(`- 当前页记录数: ${json.data.length}`);
      } else {
        console.log('\n✗ API返回错误码:', json.code);
        console.log('错误信息:', json.message);
      }
    } catch (error) {
      console.log('原始响应:');
      console.log(data);
    }
  });
});

req.on('error', (error) => {
  console.error('✗ 请求失败:');
  console.error(error.message);
});

req.end();
