// 测试导入API
const http = require('http');

const testData = {
  headers: ['姓名', '身份证号', '与户主关系', '户主姓名', '组别'],
  data: [
    ['张三', '110101199001011234', '本人', '张三', '一组'],
    ['李四', '110101199001011235', '配偶', '张三', '一组']
  ],
  mapping: [
    { excelField: '姓名', dbField: 'name' },
    { excelField: '身份证号', dbField: 'id_card' },
    { excelField: '与户主关系', dbField: 'relationship_to_head' },
    { excelField: '户主姓名', dbField: 'household_head_name' },
    { excelField: '组别', dbField: 'village_group' }
  ]
};

const postData = JSON.stringify(testData);

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/import-residents',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('测试数据:', JSON.stringify(testData, null, 2));
console.log('\n正在发送请求到 http://localhost:3001/import-residents\n');

const req = http.request(options, (res) => {
  console.log(`状态码: ${res.statusCode}`);
  console.log(`响应头: ${JSON.stringify(res.headers)}`);

  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('\n响应内容:');
    console.log(JSON.stringify(JSON.parse(data), null, 2));
  });
});

req.on('error', (error) => {
  console.error('请求失败:', error);
});

req.write(postData);
req.end();
