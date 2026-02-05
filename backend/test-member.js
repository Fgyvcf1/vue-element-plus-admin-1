// 测试添加领导班子成员API
const http = require('http');

const postData = JSON.stringify({
  residentId: 1,
  organizationType: '村两委',
  termNumber: 1,
  termStartDate: '2024-01-01',
  termEndDate: '2027-12-31',
  position: '主任',
  status: 'current',
  remarks: '测试'
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/committee-members',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log(`状态码: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('响应数据:', data);
    try {
      const json = JSON.parse(data);
      console.log('解析后的JSON:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('不是JSON格式');
    }
  });
});

req.on('error', (e) => {
  console.error(`请求错误: ${e.message}`);
});

req.write(postData);
req.end();
