// File upload service for handling resume and document uploads

class FileUploadService {
  constructor() {
    // Use import.meta.env for Vite instead of process.env
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  }

  // Get authentication headers
  getAuthHeaders(includeContentType = true) {
    const headers = {};
    
    const token = localStorage.getItem('crisp_auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }

    return headers;
  }

  // Handle API responses
  async handleResponse(response) {
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  }

  // Validate file before upload
  validateFile(file) {
    const errors = [];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/rtf'
    ];

    if (!file) {
      errors.push('No file selected');
      return errors;
    }

    // Check file size
    if (file.size > maxSize) {
      errors.push(`File size exceeds maximum limit of ${maxSize / (1024 * 1024)}MB`);
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      errors.push('Invalid file type. Only PDF, DOC, DOCX, TXT, and RTF files are allowed.');
    }

    // Check file extension
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.rtf'];
    const fileName = file.name.toLowerCase();
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    
    if (!hasValidExtension) {
      errors.push('Invalid file extension.');
    }

    return errors;
  }

  // Upload files with progress tracking
  async uploadFiles(files, options = {}) {
    const {
      category = 'resume',
      description = '',
      tags = [],
      onProgress = null
    } = options;

    if (!files || files.length === 0) {
      throw new Error('No files to upload');
    }

    // Validate all files first
    const validationErrors = [];
    for (let i = 0; i < files.length; i++) {
      const fileErrors = this.validateFile(files[i]);
      if (fileErrors.length > 0) {
        validationErrors.push(`File ${i + 1} (${files[i].name}): ${fileErrors.join(', ')}`);
      }
    }

    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join('\n'));
    }

    // Create FormData
    const formData = new FormData();
    
    // Add files
    for (const file of files) {
      formData.append('files', file);
    }

    // Add metadata
    formData.append('category', category);
    formData.append('description', description);
    
    if (Array.isArray(tags)) {
      tags.forEach(tag => formData.append('tags', tag));
    }

    try {
      const response = await fetch(`${this.baseURL}/files/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('crisp_auth_token')}`
        },
        body: formData
      });

      // Handle progress if XMLHttpRequest is used instead
      if (onProgress && typeof XMLHttpRequest !== 'undefined') {
        return this.uploadFilesWithProgress(formData, onProgress);
      }

      const data = await this.handleResponse(response);
      
      if (data.success) {
        return {
          success: true,
          files: data.data.files,
          message: data.message
        };
      }

      throw new Error(data.message || 'Upload failed');
    } catch (error) {
      throw new Error(error.message || 'Network error during upload');
    }
  }

  // Upload with XMLHttpRequest for progress tracking
  uploadFilesWithProgress(formData, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        try {
          const data = JSON.parse(xhr.responseText);
          
          if (xhr.status >= 200 && xhr.status < 300 && data.success) {
            resolve({
              success: true,
              files: data.data.files,
              message: data.message
            });
          } else {
            reject(new Error(data.message || 'Upload failed'));
          }
        } catch (error) {
          reject(new Error('Invalid response from server'));
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      // Handle abort
      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });

      // Start upload
      xhr.open('POST', `${this.baseURL}/files/upload`);
      xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('crisp_auth_token')}`);
      xhr.send(formData);
    });
  }

  // Get user's files
  async getFiles(options = {}) {
    const { category, page = 1, limit = 50 } = options;
    
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    if (category) {
      params.append('category', category);
    }

    try {
      const response = await fetch(`${this.baseURL}/files?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await this.handleResponse(response);
      
      if (data.success) {
        return {
          success: true,
          files: data.data.files,
          pagination: data.data.pagination
        };
      }

      throw new Error(data.message || 'Failed to fetch files');
    } catch (error) {
      throw new Error(error.message || 'Network error while fetching files');
    }
  }

  // Get file details
  async getFileDetails(fileId) {
    try {
      const response = await fetch(`${this.baseURL}/files/${fileId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await this.handleResponse(response);
      
      if (data.success) {
        return {
          success: true,
          file: data.data.file
        };
      }

      throw new Error(data.message || 'Failed to fetch file details');
    } catch (error) {
      throw new Error(error.message || 'Network error while fetching file details');
    }
  }

  // Download file
  async downloadFile(fileId, filename = 'download') {
    try {
      const response = await fetch(`${this.baseURL}/files/download/${fileId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('crisp_auth_token')}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Download failed');
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      throw new Error(error.message || 'Network error during download');
    }
  }

  // Delete file
  async deleteFile(fileId) {
    try {
      const response = await fetch(`${this.baseURL}/files/${fileId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      const data = await this.handleResponse(response);
      
      if (data.success) {
        return { success: true, message: data.message };
      }

      throw new Error(data.message || 'Failed to delete file');
    } catch (error) {
      throw new Error(error.message || 'Network error while deleting file');
    }
  }

  // Update file metadata
  async updateFile(fileId, updates) {
    try {
      const response = await fetch(`${this.baseURL}/files/${fileId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      const data = await this.handleResponse(response);
      
      if (data.success) {
        return {
          success: true,
          file: data.data.file,
          message: data.message
        };
      }

      throw new Error(data.message || 'Failed to update file');
    } catch (error) {
      throw new Error(error.message || 'Network error while updating file');
    }
  }

  // Get file statistics
  async getFileStats() {
    try {
      const response = await fetch(`${this.baseURL}/files/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await this.handleResponse(response);
      
      if (data.success) {
        return {
          success: true,
          stats: data.data.stats
        };
      }

      throw new Error(data.message || 'Failed to fetch file statistics');
    } catch (error) {
      throw new Error(error.message || 'Network error while fetching statistics');
    }
  }

  // Get file preview URL
  getPreviewUrl(fileId) {
    return `${this.baseURL}/files/preview/${fileId}`;
  }

  // Get file download URL
  getDownloadUrl(fileId) {
    return `${this.baseURL}/files/download/${fileId}`;
  }

  // Format file size for display
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Get file type icon
  getFileTypeIcon(mimetype) {
    if (mimetype.includes('pdf')) return '📄';
    if (mimetype.includes('word')) return '📝';
    if (mimetype.includes('text')) return '📃';
    return '📄';
  }

  // Analyze file with AI
  async analyzeFile(fileId) {
    try {
      const response = await fetch(`${this.baseURL}/files/${fileId}/analyze`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      const data = await this.handleResponse(response);
      
      if (data.success) {
        return {
          success: true,
          analysis: data.data,
          message: data.message
        };
      }

      return {
        success: false,
        error: data.error,
        analysis: data.data, // Fallback data if available
        message: data.message
      };
    } catch (error) {
      throw new Error(error.message || 'Network error during AI analysis');
    }
  }
}

// Export singleton instance
const fileUploadService = new FileUploadService();
export default fileUploadService;