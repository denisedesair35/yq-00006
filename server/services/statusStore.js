const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const STATUS_FILE = path.join(DATA_DIR, 'file-status.json');

const VALID_STATUSES = ['待处理', '已整理', '忽略'];

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadData() {
  ensureDataDir();
  if (!fs.existsSync(STATUS_FILE)) {
    return { folders: {} };
  }
  try {
    const content = fs.readFileSync(STATUS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('读取状态文件失败:', err.message);
    return { folders: {} };
  }
}

function saveData(data) {
  ensureDataDir();
  try {
    fs.writeFileSync(STATUS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('保存状态文件失败:', err.message);
    return false;
  }
}

function normalizeFilePath(filePath) {
  return path.resolve(filePath);
}

function getStatus(folderPath, filePath) {
  const data = loadData();
  const folderKey = path.resolve(folderPath);
  const fileKey = normalizeFilePath(filePath);
  if (data.folders[folderKey] && data.folders[folderKey].files[fileKey]) {
    return data.folders[folderKey].files[fileKey];
  }
  return '待处理';
}

function setStatus(folderPath, filePath, status) {
  if (!VALID_STATUSES.includes(status)) {
    throw new Error('无效的状态值，必须是：待处理、已整理、忽略');
  }

  const data = loadData();
  const folderKey = path.resolve(folderPath);
  const fileKey = normalizeFilePath(filePath);

  if (!data.folders[folderKey]) {
    data.folders[folderKey] = { files: {} };
  }

  data.folders[folderKey].files[fileKey] = status;
  data.folders[folderKey].updatedAt = new Date().toISOString();

  return saveData(data);
}

function getAllStatuses(folderPath) {
  const data = loadData();
  const folderKey = path.resolve(folderPath);
  if (data.folders[folderKey]) {
    return data.folders[folderKey].files || {};
  }
  return {};
}

function getStatusStats(folderPath, files) {
  const statuses = getAllStatuses(folderPath);
  const stats = {
    '待处理': 0,
    '已整理': 0,
    '忽略': 0
  };

  for (const file of files) {
    const fileKey = normalizeFilePath(file.path);
    const status = statuses[fileKey] || '待处理';
    stats[status] = (stats[status] || 0) + 1;
  }

  return stats;
}

module.exports = {
  getStatus,
  setStatus,
  getAllStatuses,
  getStatusStats,
  VALID_STATUSES
};
