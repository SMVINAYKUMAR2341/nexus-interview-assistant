// Utility functions for error handling and validation

export const handleAsyncError = (error, fallbackMessage = 'An unexpected error occurred') => {
  console.error('Async error:', error);
  
  if (error.name === 'NetworkError' || error.message.includes('fetch')) {
    return 'Network error. Please check your internet connection and try again.';
  }
  
  if (error.name === 'ValidationError') {
    return error.message;
  }
  
  if (error.name === 'FileError' || error.message.includes('file')) {
    return 'File processing error. Please ensure the file is valid and try again.';
  }
  
  return error.message || fallbackMessage;
};

export const validateFileSize = (file, maxSizeMB = 10) => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    throw new Error(`File size must be less than ${maxSizeMB}MB`);
  }
  return true;
};

export const validateFileType = (file, allowedTypes = ['.pdf', '.docx']) => {
  const fileExtension = file.name.toLowerCase().split('.').pop();
  const isAllowed = allowedTypes.some(type => type.includes(fileExtension));
  
  if (!isAllowed) {
    throw new Error(`Only ${allowedTypes.join(', ')} files are allowed`);
  }
  return true;
};

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove potentially dangerous characters
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const retry = async (fn, maxAttempts = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

export const isOnline = () => {
  return navigator.onLine;
};

export const formatErrorForUser = (error) => {
  const commonErrors = {
    'Failed to fetch': 'Network connection failed. Please check your internet connection.',
    'NetworkError': 'Network error occurred. Please try again.',
    'TypeError: Failed to fetch': 'Unable to connect to the server. Please try again later.',
    'SecurityError': 'Security error. Please ensure you\'re using a secure connection.',
  };

  const errorMessage = error.message || error.toString();
  
  // Check for common error patterns
  for (const [pattern, userMessage] of Object.entries(commonErrors)) {
    if (errorMessage.includes(pattern)) {
      return userMessage;
    }
  }

  // Generic fallback
  return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
};

export const logError = (error, context = '') => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name
    },
    context,
    userAgent: navigator.userAgent,
    url: window.location.href
  };

  // In a real application, you would send this to a logging service
  console.error('Application Error:', errorLog);
  
  // Store locally for debugging (optional)
  try {
    const logs = JSON.parse(localStorage.getItem('app_error_logs') || '[]');
    logs.push(errorLog);
    // Keep only last 10 errors
    if (logs.length > 10) {
      logs.splice(0, logs.length - 10);
    }
    localStorage.setItem('app_error_logs', JSON.stringify(logs));
  } catch (e) {
    console.warn('Could not store error log locally:', e);
  }
};