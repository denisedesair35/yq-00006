let currentFolder = '';
let allFiles = [];
let filteredFiles = [];
let selectedFiles = new Set();

const scanBtn = document.getElementById('scanBtn');
const refreshBtn = document.getElementById('refreshBtn');
const folderPathInput = document.getElementById('folderPath');
const scanMessage = document.getElementById('scanMessage');

const statsSection = document.getElementById('statsSection');
const filterSection = document.getElementById('filterSection');
const fileListSection = document.getElementById('fileListSection');

const searchInput = document.getElementById('searchInput');
const typeFilter = document.getElementById('typeFilter');
const statusFilter = document.getElementById('statusFilter');
const sortSelect = document.getElementById('sortSelect');
const selectAllCheckbox = document.getElementById('selectAll');

function showMessage(text, type = 'info') {
  scanMessage.textContent = text;
  scanMessage.className = 'message ' + type;
}

function clearMessage() {
  scanMessage.className = 'message';
  scanMessage.textContent = '';
}

function renderStats(data) {
  const { stats, statusStats, folderPath } = data;

  document.getElementById('currentFolder').textContent = '当前目录：' + folderPath;
  document.getElementById('statTotalCount').textContent = stats.totalCount;
  document.getElementById('statTotalSize').textContent = stats.totalSizeFormatted;
  document.getElementById('statPending').textContent = statusStats['待处理'] || 0;
  document.getElementById('statDone').textContent = statusStats['已整理'] || 0;
  document.getElementById('statIgnored').textContent = statusStats['忽略'] || 0;

  const byTypeHtml = Object.entries(stats.byType)
    .sort((a, b) => b[1] - a[1])
    .map(([key, value]) => `
      <div class="stats-item">
        <span class="stats-item-key">${key}</span>
        <span class="stats-item-value">${value} 个</span>
      </div>
    `).join('');
  document.getElementById('byType').innerHTML = byTypeHtml || '<div class="stats-item"><span class="stats-item-key">暂无数据</span></div>';

  const dateOrder = ['最近 7 天', '最近 30 天', '最近 90 天', '最近一年', '一年以前'];
  const byDateHtml = dateOrder
    .filter(key => stats.byDateRange[key])
    .map(key => `
      <div class="stats-item">
        <span class="stats-item-key">${key}</span>
        <span class="stats-item-value">${stats.byDateRange[key]} 个</span>
      </div>
    `).join('');
  document.getElementById('byDate').innerHTML = byDateHtml || '<div class="stats-item"><span class="stats-item-key">暂无数据</span></div>';

  const sizeOrder = ['小于 1MB', '1MB - 10MB', '10MB - 100MB', '100MB - 1GB', '大于 1GB'];
  const bySizeHtml = sizeOrder
    .filter(key => stats.bySizeRange[key])
    .map(key => `
      <div class="stats-item">
        <span class="stats-item-key">${key}</span>
        <span class="stats-item-value">${stats.bySizeRange[key]} 个</span>
      </div>
    `).join('');
  document.getElementById('bySize').innerHTML = bySizeHtml || '<div class="stats-item"><span class="stats-item-key">暂无数据</span></div>';

  const types = [...new Set(allFiles.map(f => f.type))].sort();
  typeFilter.innerHTML = '<option value="">全部类型</option>' +
    types.map(t => `<option value="${t}">${t}</option>`).join('');
}

function getStatusClass(status) {
  switch (status) {
    case '待处理': return 'status-pending';
    case '已整理': return 'status-done';
    case '忽略': return 'status-ignored';
    default: return 'status-pending';
  }
}

function renderFileList() {
  const fileList = document.getElementById('fileList');
  const emptyState = document.getElementById('emptyState');
  const resultCount = document.getElementById('resultCount');
  const batchActions = document.getElementById('batchActions');

  resultCount.textContent = filteredFiles.length;

  if (filteredFiles.length === 0) {
    fileList.innerHTML = '';
    emptyState.style.display = 'block';
    batchActions.style.display = 'none';
    return;
  }

  emptyState.style.display = 'none';
  batchActions.style.display = selectedFiles.size > 0 ? 'inline' : 'none';

  const html = filteredFiles.map(file => {
    const isSelected = selectedFiles.has(file.path);
    return `
      <div class="file-item ${isSelected ? 'selected' : ''}" data-path="${file.path}">
        <div class="file-checkbox">
          <input type="checkbox" class="file-select" ${isSelected ? 'checked' : ''} data-path="${file.path}" />
        </div>
        <div class="file-name-col">
          <div class="file-name" title="${file.name}">${file.name}</div>
          <div class="file-path" title="${file.relativePath}">${file.relativePath}</div>
        </div>
        <div class="file-type-col">
          <span class="file-type-badge">${file.type}</span>
        </div>
        <div class="file-size-col">${file.sizeFormatted}</div>
        <div class="file-date-col">${file.mtimeFormatted}</div>
        <div class="file-status-col">
          <span class="status-badge ${getStatusClass(file.status)}">${file.status}</span>
        </div>
        <div class="file-action-col">
          ${file.status !== '已整理' ? `<button class="btn btn-status-done" onclick="setStatus('${file.path}', '已整理')">已整理</button>` : ''}
          ${file.status !== '忽略' ? `<button class="btn btn-status-ignored" onclick="setStatus('${file.path}', '忽略')">忽略</button>` : ''}
          ${file.status !== '待处理' ? `<button class="btn btn-status-pending" onclick="setStatus('${file.path}', '待处理')">待处理</button>` : ''}
        </div>
      </div>
    `;
  }).join('');

  fileList.innerHTML = html;

  document.querySelectorAll('.file-select').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const path = e.target.dataset.path;
      if (e.target.checked) {
        selectedFiles.add(path);
        e.target.closest('.file-item').classList.add('selected');
      } else {
        selectedFiles.delete(path);
        e.target.closest('.file-item').classList.remove('selected');
      }
      updateSelectAllState();
      batchActions.style.display = selectedFiles.size > 0 ? 'inline' : 'none';
    });
  });
}

function updateSelectAllState() {
  const visibleCount = filteredFiles.length;
  const selectedVisibleCount = filteredFiles.filter(f => selectedFiles.has(f.path)).length;
  selectAllCheckbox.checked = visibleCount > 0 && selectedVisibleCount === visibleCount;
  selectAllCheckbox.indeterminate = selectedVisibleCount > 0 && selectedVisibleCount < visibleCount;
}

function applyFilters() {
  const searchTerm = searchInput.value.toLowerCase().trim();
  const typeVal = typeFilter.value;
  const statusVal = statusFilter.value;
  const sortVal = sortSelect.value;

  filteredFiles = allFiles.filter(file => {
    if (searchTerm && !file.name.toLowerCase().includes(searchTerm) && !file.relativePath.toLowerCase().includes(searchTerm)) {
      return false;
    }
    if (typeVal && file.type !== typeVal) {
      return false;
    }
    if (statusVal && file.status !== statusVal) {
      return false;
    }
    return true;
  });

  switch (sortVal) {
    case 'name':
      filteredFiles.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
      break;
    case 'size':
      filteredFiles.sort((a, b) => b.size - a.size);
      break;
    case 'mtime':
      filteredFiles.sort((a, b) => new Date(b.mtime) - new Date(a.mtime));
      break;
    case 'type':
      filteredFiles.sort((a, b) => a.type.localeCompare(b.type, 'zh-CN') || a.name.localeCompare(b.name, 'zh-CN'));
      break;
  }

  renderFileList();
}

async function scanFolder() {
  const folderPath = folderPathInput.value.trim();

  if (!folderPath) {
    showMessage('请输入文件夹路径', 'error');
    return;
  }

  clearMessage();
  scanBtn.disabled = true;
  scanBtn.textContent = '扫描中...';

  try {
    const result = await API.scanFolder(folderPath);

    if (result.success) {
      currentFolder = result.data.folderPath;
      allFiles = result.data.files;
      filteredFiles = [...allFiles];
      selectedFiles.clear();

      renderStats(result.data);
      applyFilters();

      statsSection.style.display = 'block';
      filterSection.style.display = 'block';
      fileListSection.style.display = 'block';
      refreshBtn.style.display = 'inline-block';

      showMessage(`扫描完成，共找到 ${allFiles.length} 个文件`, 'success');
    } else {
      showMessage('扫描失败：' + result.error, 'error');
    }
  } catch (err) {
    showMessage('网络错误，请检查服务是否启动', 'error');
    console.error(err);
  } finally {
    scanBtn.disabled = false;
    scanBtn.textContent = '扫描文件夹';
  }
}

async function setStatus(filePath, status) {
  try {
    const result = await API.updateStatus(currentFolder, filePath, status);
    if (result.success) {
      const file = allFiles.find(f => f.path === filePath);
      if (file) {
        file.status = status;
      }

      const statusStats = {
        '待处理': 0,
        '已整理': 0,
        '忽略': 0
      };
      for (const f of allFiles) {
        statusStats[f.status] = (statusStats[f.status] || 0) + 1;
      }
      document.getElementById('statPending').textContent = statusStats['待处理'] || 0;
      document.getElementById('statDone').textContent = statusStats['已整理'] || 0;
      document.getElementById('statIgnored').textContent = statusStats['忽略'] || 0;

      applyFilters();
    }
  } catch (err) {
    console.error('更新状态失败:', err);
    alert('更新状态失败');
  }
}

async function batchSetStatus(status) {
  if (selectedFiles.size === 0) {
    alert('请先选择文件');
    return;
  }

  const updates = Array.from(selectedFiles).map(path => ({ filePath: path, status }));

  try {
    const result = await API.batchUpdateStatus(currentFolder, updates);
    if (result.success) {
      for (const path of selectedFiles) {
        const file = allFiles.find(f => f.path === path);
        if (file) {
          file.status = status;
        }
      }

      const statusStats = {
        '待处理': 0,
        '已整理': 0,
        '忽略': 0
      };
      for (const f of allFiles) {
        statusStats[f.status] = (statusStats[f.status] || 0) + 1;
      }
      document.getElementById('statPending').textContent = statusStats['待处理'] || 0;
      document.getElementById('statDone').textContent = statusStats['已整理'] || 0;
      document.getElementById('statIgnored').textContent = statusStats['忽略'] || 0;

      applyFilters();
      alert(result.message);
    }
  } catch (err) {
    console.error('批量更新失败:', err);
    alert('批量更新失败');
  }
}

function init() {
  scanBtn.addEventListener('click', scanFolder);
  refreshBtn.addEventListener('click', scanFolder);

  folderPathInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      scanFolder();
    }
  });

  searchInput.addEventListener('input', debounce(applyFilters, 300));
  typeFilter.addEventListener('change', applyFilters);
  statusFilter.addEventListener('change', applyFilters);
  sortSelect.addEventListener('change', applyFilters);

  selectAllCheckbox.addEventListener('change', (e) => {
    if (e.target.checked) {
      for (const file of filteredFiles) {
        selectedFiles.add(file.path);
      }
    } else {
      for (const file of filteredFiles) {
        selectedFiles.delete(file.path);
      }
    }
    renderFileList();
  });
}

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

document.addEventListener('DOMContentLoaded', init);
