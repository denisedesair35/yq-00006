const express = require('express');
const { setStatus, batchSetStatus, getAllStatuses, VALID_STATUSES } = require('../services/statusStore');

const router = express.Router();

router.put('/update', (req, res) => {
  try {
    const { folderPath, filePath, status } = req.body;

    if (!folderPath || !filePath || !status) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数：folderPath, filePath, status'
      });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: '无效的状态值，必须是：待处理、已整理、忽略'
      });
    }

    const success = setStatus(folderPath, filePath, status);

    if (success) {
      res.json({
        success: true,
        message: '状态更新成功',
        data: { filePath, status }
      });
    } else {
      res.status(500).json({
        success: false,
        error: '保存状态失败'
      });
    }
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

router.post('/batch-update', (req, res) => {
  try {
    const { folderPath, updates } = req.body;

    if (!folderPath || !updates || !Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数：folderPath, updates（数组）'
      });
    }

    const result = batchSetStatus(folderPath, updates);

    if (result.success) {
      res.json({
        success: true,
        message: `批量更新完成：成功 ${result.successCount} 个，失败 ${result.failCount} 个`,
        data: { successCount: result.successCount, failCount: result.failCount }
      });
    } else {
      res.status(500).json({
        success: false,
        error: '保存状态失败'
      });
    }
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

router.get('/list', (req, res) => {
  try {
    const { folderPath } = req.query;

    if (!folderPath) {
      return res.status(400).json({
        success: false,
        error: '请提供 folderPath 参数'
      });
    }

    const statuses = getAllStatuses(folderPath);

    res.json({
      success: true,
      data: {
        folderPath,
        statuses
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
