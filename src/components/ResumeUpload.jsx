import React, { useState, useEffect } from 'react';
import { Upload, Button, message, Progress, Card, Typography, Popconfirm } from 'antd';
import { InboxOutlined, DeleteOutlined } from '@ant-design/icons';
import fileUploadService from '../lib/fileUploadService';
import { useAuthStore } from '../store/useAuthStore';
import DataCollectionModal from './DataCollectionModal';

const { Dragger } = Upload;
const { Text } = Typography;

const ResumeUpload = ({ onResumeUploaded, loading = false, showFileList = true }) => {
  const { user } = useAuthStore();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [pendingData, setPendingData] = useState(null);
  const [userFiles, setUserFiles] = useState([]);

  // Load user's uploaded files
  const loadUserFiles = async () => {
    try {
      if (user && user.role === 'Interviewee') {
        const result = await fileUploadService.getFiles({ category: 'resume' });
        if (result.success) {
          setUserFiles(result.files || []);
        }
      }
    } catch (error) {
      console.error('Error loading user files:', error);
    }
  };

  // Load files when component mounts or user changes
  useEffect(() => {
    if (showFileList) {
      loadUserFiles();
    }
  }, [user, showFileList]);

  const handleClearAllFiles = async () => {
    try {
      setIsDeleting(true);
      const result = await fileUploadService.getFiles({ category: 'resume' });
      
      if (result.success && result.files.length > 0) {
        // Delete all resume files
        for (const file of result.files) {
          await fileUploadService.deleteFile(file._id);
        }
        message.success(`${result.files.length} file(s) deleted successfully`);
        // Refresh the file list after deletion
        await loadUserFiles();
      } else {
        message.info('No files to delete');
      }
    } catch (error) {
      console.error('Error deleting files:', error);
      message.error('Failed to delete files');
    } finally {
      setIsDeleting(false);
    }
  };



  const handleUpload = async (file) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Check if user is logged in
      if (!user) {
        message.error('Please login first to upload files');
        setIsUploading(false);
        return false;
      }

      // Check if user has the right role
      if (user.role !== 'Interviewee') {
        message.error('Only Interviewees can upload resume files');
        setIsUploading(false);
        return false;
      }

      // Check if token exists
      const token = localStorage.getItem('crisp_auth_token');
      if (!token) {
        message.error('Authentication token missing. Please login again.');
        setIsUploading(false);
        return false;
      }

      // Validate file client-side
      const validationErrors = fileUploadService.validateFile(file);
      if (validationErrors.length > 0) {
        message.error(validationErrors.join(', '));
        setIsUploading(false);
        return false;
      }

      // Show loading message
      const loadingMessage = message.loading('Processing resume...', 0);

      // First, upload file to MongoDB backend for permanent storage
      if (user && user.role === 'Interviewee') {
        setUploadProgress(20);
        try {
          const uploadResult = await fileUploadService.uploadFiles([file], {
            category: 'resume',
            description: 'Resume upload for interview',
            onProgress: (progress) => {
              setUploadProgress(20 + (progress * 0.4)); // 20-60%
            }
          });

          if (!uploadResult.success) {
            throw new Error(uploadResult.message || 'Upload to database failed');
          }

          console.log('Upload result:', uploadResult);
          console.log('Upload result files:', uploadResult.files);
          message.success('File uploaded to database successfully!');
          setUploadProgress(60);

          // Get the uploaded file ID for analysis
          const uploadedFile = uploadResult.files && uploadResult.files[0];
          console.log('Uploaded file object:', uploadedFile);
          
          if (!uploadedFile) {
            console.error('No uploaded file in result:', uploadResult);
            throw new Error('No uploaded file found in response');
          }
          
          const fileId = uploadedFile._id || uploadedFile.id;
          if (!fileId) {
            console.error('No id or _id in uploaded file:', uploadedFile);
            throw new Error(`Uploaded file missing id. Available keys: ${Object.keys(uploadedFile || {}).join(', ')}`);
          }

          // Analyze resume content with Perplexity AI via backend
          setUploadProgress(70);
          console.log('Starting AI analysis for file ID:', fileId);
          const analysisResult = await fileUploadService.analyzeFile(fileId);
          setUploadProgress(90);
          
          if (analysisResult.success) {
            console.log('AI analysis successful:', analysisResult.analysis);
            setUploadProgress(100);
            
            // Pass AI analysis data to parent component
            onResumeUploaded(analysisResult.analysis);
            loadingMessage();
            message.success('Resume uploaded and analyzed successfully with AI!');

            // Reload file list from MongoDB
            if (showFileList && user && user.role === 'Interviewee') {
              await loadUserFiles();
            }
          } else {
            console.error('AI analysis failed:', analysisResult.error);
            setUploadProgress(100);
            loadingMessage();
            message.error(`Failed to analyze resume with AI: ${analysisResult.error || 'Unknown error'}`);
          }

        } catch (uploadError) {
          console.error('MongoDB upload error:', uploadError);
          console.error('Error details:', {
            message: uploadError.message,
            user: user ? `${user.email} (${user.role})` : 'No user',
            token: localStorage.getItem('crisp_auth_token') ? 'Token exists' : 'No token'
          });
          loadingMessage();
          
          // More specific error message
          if (uploadError.message.includes('401') || uploadError.message.includes('Unauthorized')) {
            message.error('Authentication failed. Please login again.');
          } else if (uploadError.message.includes('fetch')) {
            message.error('Failed to connect to backend server. Please ensure backend server is running on port 5001.');
          } else {
            message.error(`Upload failed: ${uploadError.message}`);
          }
          
          setIsUploading(false);
          return false;
        }
      }
    } catch (error) {
      message.error(error.message || 'Error processing resume');
      console.error('Resume upload error:', error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
    
    return false; // Prevent default upload behavior
  };



  const uploadProps = {
    name: 'resume',
    multiple: false,
    accept: '.pdf,.doc,.docx,.txt,.rtf',
    beforeUpload: handleUpload,
    showUploadList: false,
    disabled: loading || isUploading || (user && user.role !== 'Interviewee')
  };

  // Show access denied message for non-interviewees
  if (user && user.role !== 'Interviewee') {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Text type="secondary">
            Resume upload is only available for interviewees.
          </Text>
        </div>
      </Card>
    );
  }

  return (
    <div className="resume-upload">
      <Card 
        title="Resume Upload"
        extra={
          user && user.role === 'Interviewee' && (
            <Popconfirm
              title="Delete All Files"
              description="Are you sure you want to delete all your uploaded resume files?"
              onConfirm={handleClearAllFiles}
              okText="Yes, Delete All"
              cancelText="Cancel"
              okType="danger"
            >
              <Button 
                icon={<DeleteOutlined />} 
                danger 
                size="small"
                loading={isDeleting}
                disabled={isUploading}
              >
                Clear Files
              </Button>
            </Popconfirm>
          )
        }
      >
        <Dragger {...uploadProps}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
          </p>
          <p className="ant-upload-text">
            Click or drag your resume to this area to upload
          </p>
          <p className="ant-upload-hint">
            Support for PDF, DOC, DOCX, TXT, and RTF files (max 10MB). 
            We'll extract your information automatically.
            <br />
            <small style={{ color: '#666' }}>
              Files are securely stored and only accessible to you and authorized interviewers.
            </small>
          </p>
        </Dragger>

        {isUploading && (
          <div style={{ marginTop: '16px' }}>
            <Progress 
              percent={uploadProgress} 
              status="active"
              showInfo={true}
              format={(percent) => `${percent}% uploaded`}
            />
          </div>
        )}

        {/* File List */}
        {showFileList && userFiles.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <Text strong>Uploaded Files:</Text>
            <div style={{ marginTop: '8px' }}>
              {userFiles.map((file, index) => (
                <div key={file._id || index} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '8px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px',
                  marginBottom: '4px'
                }}>
                  <Text>{file.originalName || file.filename}</Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {new Date(file.uploadedAt || file.uploadDate).toLocaleDateString()}
                  </Text>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>



      {/* Data Collection Modal */}
      <DataCollectionModal
        visible={showDataModal}
        candidateData={pendingData}
        onComplete={(completeData) => {
          setShowDataModal(false);
          onResumeUploaded(completeData);
          message.success('Profile completed! Ready to start interview.');
        }}
        onCancel={() => {
          setShowDataModal(false);
          setPendingData(null);
          message.info('Interview cancelled. Please complete your profile to proceed.');
        }}
      />
    </div>
  );
};

export default ResumeUpload;