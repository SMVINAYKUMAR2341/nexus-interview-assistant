import React, { useState } from 'react';
import { Upload, Button, message, Progress, Card, List, Typography, Space, Tag } from 'antd';
import { InboxOutlined, DeleteOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import { parseResumeFile, checkMissingFields } from '../lib/resumeParser';
import fileUploadService from '../lib/fileUploadService';
import { useAuthStore } from '../store/useAuthStore';
import DataCollectionModal from './DataCollectionModal';

const { Dragger } = Upload;
const { Text } = Typography;

const ResumeUpload = ({ onResumeUploaded, loading = false, showFileList = true }) => {
  const { user } = useAuthStore();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [pendingData, setPendingData] = useState(null);

  // Load user's uploaded files on component mount
  React.useEffect(() => {
    if (user && user.role === 'Interviewee' && showFileList) {
      loadUserFiles();
    }
  }, [user, showFileList]);

  const loadUserFiles = async () => {
    try {
      setLoadingFiles(true);
      const result = await fileUploadService.getFiles({ category: 'resume' });
      if (result.success) {
        setUploadedFiles(result.files);
      }
    } catch (error) {
      console.error('Error loading files:', error);
      message.error('Failed to load uploaded files');
    } finally {
      setLoadingFiles(false);
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

          message.success('File uploaded to database successfully!');
          setUploadProgress(60);
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

      // Parse resume content for AI analysis
      setUploadProgress(70);
      const parseResult = await parseResumeFile(file);
      setUploadProgress(90);
      
      if (parseResult.success) {
        // Check for missing fields
        const missingFields = checkMissingFields(parseResult.data);
        setUploadProgress(100);
        
        // Always pass data to parent component - it will handle missing fields via chatbot
        onResumeUploaded(parseResult.data);
        loadingMessage();
        
        if (missingFields.length > 0) {
          message.success(`Resume uploaded successfully! Please provide missing information: ${missingFields.join(', ')}`);
        } else {
          message.success('Resume uploaded and analyzed successfully!');
        }

        // Reload file list from MongoDB
        if (showFileList && user && user.role === 'Interviewee') {
          await loadUserFiles();
        }
      } else {
        loadingMessage();
        message.error('Failed to parse resume. File is stored in database but could not be analyzed.');
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

  const handleDeleteFile = async (fileId, fileName) => {
    try {
      const result = await fileUploadService.deleteFile(fileId);
      if (result.success) {
        message.success(`${fileName} deleted successfully`);
        await loadUserFiles(); // Reload file list
      }
    } catch (error) {
      message.error(error.message || 'Failed to delete file');
    }
  };

  const handleDownloadFile = async (fileId, fileName) => {
    try {
      await fileUploadService.downloadFile(fileId, fileName);
      message.success(`${fileName} downloaded`);
    } catch (error) {
      message.error(error.message || 'Failed to download file');
    }
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
      <Card title="Resume Upload" style={{ marginBottom: showFileList ? '20px' : '0' }}>
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
      </Card>

      {showFileList && (
        <Card 
          title="Your Uploaded Files" 
          loading={loadingFiles}
          extra={
            <Button 
              type="link" 
              onClick={loadUserFiles}
              size="small"
            >
              Refresh
            </Button>
          }
        >
          {uploadedFiles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Text type="secondary">No files uploaded yet</Text>
            </div>
          ) : (
            <List
              dataSource={uploadedFiles}
              renderItem={(file) => (
                <List.Item
                  actions={[
                    <Button
                      key="preview"
                      type="link"
                      icon={<EyeOutlined />}
                      onClick={() => window.open(file.previewUrl, '_blank')}
                      size="small"
                    >
                      Preview
                    </Button>,
                    <Button
                      key="download"
                      type="link"
                      icon={<DownloadOutlined />}
                      onClick={() => handleDownloadFile(file._id, file.originalName)}
                      size="small"
                    >
                      Download
                    </Button>,
                    <Button
                      key="delete"
                      type="link"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteFile(file._id, file.originalName)}
                      size="small"
                    >
                      Delete
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <Text>{file.originalName}</Text>
                        <Tag color="blue">{file.category}</Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size="small">
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {fileUploadService.formatFileSize(file.size)} • 
                          Uploaded {new Date(file.uploadedAt).toLocaleDateString()}
                        </Text>
                        {file.description && (
                          <Text style={{ fontSize: '12px' }}>{file.description}</Text>
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Card>
      )}

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