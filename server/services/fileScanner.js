const fs = require('fs');
const path = require('path');

const FILE_TYPE_MAP = {
  '文档': ['.doc', '.docx', '.pdf', '.txt', '.md', '.rtf', '.odt', '.xls', '.xlsx', '.csv', '.ppt', '.pptx'],
  '图片': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.ico', '.tiff'],
  '视频': ['.mp4', '.avi', '.mov', '.mkv', '.flv', '.wmv', '.webm'],
  '音频': ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma'],
  '压缩包': ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2'],
  '代码': ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.c', '.cpp', '.html', '.css', '.json', '.xml', '.go', '.rs', '.rb', '.php'],
  '可执行': ['.exe', '.msi', '.bat', '.sh', '.app', '.dmg'],
  '其他': []
};

function getFileType(ext) {
  ext = ext.toLowerCase();
  for (const [type, exts] of Object.entries(FILE_TYPE_MAP)) {
    if (exts.includes(ext)) {
      return type;
    }
  }
  return '其他';
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function getSizeRange(bytes) {
  if (bytes < 1024 * 1024) return '小于 1MB';
  if (bytes < 10 * 1024 * 1024) return '1MB - 10MB';
  if (bytes < 100 * 1024 * 1024) return '10MB - 100MB';
  if (bytes < 1024 * 1024 * 1024) return '100MB - 1GB';
  return '大于 1GB';
}

function getDateRange(mtime) {
  const now = new Date();
  const diffDays = Math.floor((now - new Date(mtime)) / (1000 * 60 * 60 * 24));
  if (diffDays <= 7) return '最近 7 天';
  if (diffDays <= 30) return '最近 30 天';
  if (diffDays <= 90) return '最近 90 天';
  if (diffDays <= 365) return '最近一年';
  return '一年以前';
}

function scanDir(dirPath, baseDir = dirPath) {
  let results = [];
  let entries;

  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch (err) {
    return results;
  }

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = path.relative(baseDir, fullPath);

    if (entry.isDirectory()) {
      const subResults = scanDir(fullPath, baseDir);
      results = results.concat(subResults);
    } else if (entry.isFile()) {
      let stats;
      try {
        stats = fs.statSync(fullPath);
      } catch (err) {
        continue;
      }

      const ext = path.extname(entry.name);
      results.push({
        name: entry.name,
        path: fullPath,
        relativePath: relativePath,
        ext: ext.toLowerCase(),
        type: getFileType(ext),
        size: stats.size,
        sizeFormatted: formatSize(stats.size),
        sizeRange: getSizeRange(stats.size),
        mtime: stats.mtime.toISOString(),
        mtimeFormatted: stats.mtime.toLocaleString('zh-CN'),
        dateRange: getDateRange(stats.mtime)
      });
    }
  }

  return results;
}

function buildStats(files) {
  const totalCount = files.length;
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  const byType = {};
  const bySizeRange = {};
  const byDateRange = {};

  for (const file of files) {
    byType[file.type] = (byType[file.type] || 0) + 1;
    bySizeRange[file.sizeRange] = (bySizeRange[file.sizeRange] || 0) + 1;
    byDateRange[file.dateRange] = (byDateRange[file.dateRange] || 0) + 1;
  }

  return {
    totalCount,
    totalSize,
    totalSizeFormatted: formatSize(totalSize),
    byType,
    bySizeRange,
    byDateRange
  };
}

function scanFolder(folderPath) {
  if (!folderPath || !fs.existsSync(folderPath)) {
    throw new Error('文件夹路径不存在');
  }

  const stat = fs.statSync(folderPath);
  if (!stat.isDirectory()) {
    throw new Error('路径不是文件夹');
  }

  const files = scanDir(folderPath);
  const stats = buildStats(files);

  return {
    folderPath: path.resolve(folderPath),
    files,
    stats
  };
}

module.exports = {
  scanFolder,
  getFileType,
  formatSize,
  FILE_TYPE_MAP
};
