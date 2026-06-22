const API = {
  baseUrl: '/api',

  async scanFolder(folderPath) {
    const response = await fetch(`${this.baseUrl}/files/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ folderPath })
    });
    return response.json();
  },

  async updateStatus(folderPath, filePath, status) {
    const response = await fetch(`${this.baseUrl}/status/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ folderPath, filePath, status })
    });
    return response.json();
  },

  async batchUpdateStatus(folderPath, updates) {
    const response = await fetch(`${this.baseUrl}/status/batch-update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ folderPath, updates })
    });
    return response.json();
  },

  async getStatusList(folderPath) {
    const response = await fetch(`${this.baseUrl}/status/list?folderPath=${encodeURIComponent(folderPath)}`);
    return response.json();
  },

  async health() {
    const response = await fetch(`${this.baseUrl}/health`);
    return response.json();
  }
};
