const express = require('express');
const path = require('path');

const filesRouter = require('./routes/files');
const statusRouter = require('./routes/status');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/files', filesRouter);
app.use('/api/status', statusRouter);

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '本地资料整理小工具服务运行正常',
    timestamp: new Date().toISOString()
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: '接口不存在'
  });
});

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    error: '服务器内部错误'
  });
});

app.listen(PORT, () => {
  console.log('========================================');
  console.log('  本地资料整理小工具 - 服务已启动');
  console.log('========================================');
  console.log(`  访问地址: http://localhost:${PORT}`);
  console.log(`  服务端口: ${PORT}`);
  console.log('========================================');
  console.log('  按 Ctrl+C 停止服务');
  console.log('========================================');
});
