const express = require('express');
const path = require('path');
const { scanFolder } = require('../services/fileScanner');
const { getAllStatuses, getStatusStats } = require('../services/statusStore');

const router = express.Router();

router.post('/scan', (req, res) => {
  try {
    const { folderPath } = req.body;

    if (!folderPath) {
      return res.status(400).json({ error: '请提供文件夹路径' });
    }

    const result = scanFolder(folderPath);
    const statuses = getAllStatuses(folderPath);
    const statusStats = getStatusStats(folderPath, result.files);

    const filesWithStatus = result.files.map(file => ({
      ...file,
      status: statuses[path.resolve(file.path)] || '待处理'
    }));

    res.json({
      success: true,
      data: {
        folderPath: result.folderPath,
        files: filesWithStatus,
        stats: result.stats,
        statusStats
      }
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

module.exports = router;
