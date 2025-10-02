import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Set up PDF.js worker with fallback handling
// This approach works better with Vite and handles worker loading issues
if (typeof window !== 'undefined') {
  // For browser environment, use a reliable CDN
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@4.0.379/build/pdf.worker.min.js';
}

// Regular expressions for extracting information
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
const PHONE_REGEX = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;

// Common name patterns (this is a simplified approach)
const NAME_PATTERNS = [
  /^([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/m, // First line name pattern
  /Name\s*:?\s*([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i, // Name: pattern
  /([A-Z][A-Z\s]+)/, // All caps name
];

export const parseResumeFile = async (file) => {
  try {
    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      throw new Error('File size too large. Please upload a file smaller than 10MB.');
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Unsupported file type. Please upload a PDF or DOCX file.');
    }

    let extractedText = '';
    
    try {
      if (file.type === 'application/pdf') {
        extractedText = await extractTextFromPDF(file);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        extractedText = await extractTextFromDOCX(file);
      }
    } catch (extractionError) {
      console.error('File extraction error:', extractionError);
      // If PDF fails, suggest DOCX alternative
      if (file.type === 'application/pdf') {
        throw new Error(`PDF processing failed: ${extractionError.message}. Please try uploading a DOCX file instead.`);
      }
      throw extractionError;
    }

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No readable text found in the resume. Please ensure the file contains text content.');
    }

    const extractedData = extractInformation(extractedText);
    
    return {
      success: true,
      data: {
        ...extractedData,
        rawText: extractedText,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        extractedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error parsing resume:', error);
    return {
      success: false,
      error: error.message || 'Failed to parse resume file'
    };
  }
};

const extractTextFromPDF = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // First attempt with worker
    let pdf;
    try {
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true
      });
      pdf = await loadingTask.promise;
    } catch (workerError) {
      console.warn('Worker loading failed, trying without worker:', workerError);
      
      // Fallback: disable worker completely
      pdfjsLib.GlobalWorkerOptions.workerSrc = '';
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
        disableWorker: true
      });
      pdf = await loadingTask.promise;
    }
    
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map(item => item.str || '')
          .join(' ');
        fullText += pageText + '\n';
      } catch (pageError) {
        console.warn(`Error extracting page ${i}:`, pageError);
        // Continue with other pages
      }
    }

    return fullText.trim();
  } catch (error) {
    console.error('PDF extraction error:', error);
    
    // If PDF extraction completely fails, provide a user-friendly message
    if (error.message.includes('worker') || error.message.includes('fetch')) {
      throw new Error('PDF processing temporarily unavailable. Please try uploading a DOCX file instead, or try again later.');
    }
    
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
};

const extractTextFromDOCX = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

const extractInformation = (text) => {
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  return {
    name: extractName(cleanText),
    email: extractEmail(cleanText),
    phone: extractPhone(cleanText)
  };
};

const extractName = (text) => {
  // Try different name extraction patterns
  for (const pattern of NAME_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      // Validate that it looks like a real name (not too long, contains letters)
      if (name.length <= 50 && /^[A-Za-z\s.'-]+$/.test(name)) {
        return cleanName(name);
      }
    }
  }

  // Fallback: try to get the first line that looks like a name
  const lines = text.split('\n');
  for (const line of lines.slice(0, 5)) { // Check first 5 lines
    const trimmedLine = line.trim();
    if (trimmedLine.length > 0 && trimmedLine.length <= 50) {
      // Check if it looks like a name (starts with capital, contains only name-like characters)
      if (/^[A-Z][A-Za-z\s.'-]+$/.test(trimmedLine) && 
          !trimmedLine.includes('@') && 
          !trimmedLine.includes('www') &&
          !/\d{3}/.test(trimmedLine)) { // Doesn't contain 3+ consecutive digits
        return cleanName(trimmedLine);
      }
    }
  }

  return '';
};

const extractEmail = (text) => {
  const emailMatches = text.match(EMAIL_REGEX);
  if (emailMatches && emailMatches.length > 0) {
    // Return the first valid email found
    return emailMatches[0].toLowerCase();
  }
  return '';
};

const extractPhone = (text) => {
  const phoneMatches = [...text.matchAll(PHONE_REGEX)];
  if (phoneMatches && phoneMatches.length > 0) {
    // Format the first phone number found
    const match = phoneMatches[0];
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }

  // Try alternative phone patterns
  const altPhonePattern = /(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/g;
  const altMatch = text.match(altPhonePattern);
  if (altMatch && altMatch.length > 0) {
    return formatPhoneNumber(altMatch[0]);
  }

  return '';
};

const cleanName = (name) => {
  // Remove extra spaces and convert to proper case
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const formatPhoneNumber = (phone) => {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (digits.length === 11 && digits[0] === '1') {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  
  return phone; // Return original if can't format
};

// Validation functions
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  const phoneRegex = /^[\+]?[1-9]?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

export const validateName = (name) => {
  return name && name.trim().length >= 2 && /^[A-Za-z\s.'-]+$/.test(name.trim());
};

// Helper function to check required fields
export const checkMissingFields = (candidateData) => {
  const missing = [];
  
  if (!candidateData.name || !validateName(candidateData.name)) {
    missing.push('name');
  }
  
  if (!candidateData.email || !validateEmail(candidateData.email)) {
    missing.push('email');
  }
  
  if (!candidateData.phone || !validatePhone(candidateData.phone)) {
    missing.push('phone');
  }
  
  return missing;
};