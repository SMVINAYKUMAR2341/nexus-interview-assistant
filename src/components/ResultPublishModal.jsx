import React, { useState } from 'react';
import { Modal, Button, Radio, Checkbox, Space, Typography, Divider, Alert, message, List, Tag, Progress } from 'antd';
import {
  MailOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SendOutlined,
  EyeOutlined,
  ThunderboltOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { sendShortlistEmail, sendRejectionEmail, batchSendResults, getEmailTemplate } from '../lib/emailService';
import { useInterviewStore } from '../store/useInterviewStore';
import '../styles/ResultPublishModal.css';

const { Title, Text, Paragraph } = Typography;

const ResultPublishModal = ({ visible, onClose, candidates = [], onPublishComplete }) => {
  const { publishScores } = useInterviewStore();
  const [publishType, setPublishType] = useState('shortlisted'); // 'shortlisted', 'all', 'selected'
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [sendRejections, setSendRejections] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [previewCandidate, setPreviewCandidate] = useState(null);

  // Ensure candidates is an array
  const validCandidates = Array.isArray(candidates) ? candidates : [];

  // Filter candidates by score
  const shortlistedCandidates = validCandidates.filter(c => (c.finalScore || 0) >= 60);
  const rejectedCandidates = validCandidates.filter(c => (c.finalScore || 0) < 60);
  const completedCandidates = validCandidates.filter(c => c.status === 'completed');

  const handlePublish = async () => {
    try {
      setIsPublishing(true);
      let candidatesToPublish = [];

      switch (publishType) {
        case 'shortlisted':
          candidatesToPublish = shortlistedCandidates;
          break;
        case 'all':
          candidatesToPublish = completedCandidates;
          break;
        case 'selected':
          candidatesToPublish = validCandidates.filter(c => selectedCandidates.includes(c.id));
          break;
        default:
          candidatesToPublish = shortlistedCandidates;
      }

      if (candidatesToPublish.length === 0) {
        message.warning('No candidates to publish results for');
        setIsPublishing(false);
        return;
      }

      // Publish scores to make them visible to interviewees
      candidatesToPublish.forEach(candidate => {
        publishScores(candidate.id);
      });

      // Send emails
      const result = await batchSendResults(candidatesToPublish, { sendRejections });

      if (result.success) {
        message.success(
          `Successfully published results! 
          ✅ ${result.results.shortlisted} shortlisted, 
          📊 Scores now visible to ${candidatesToPublish.length} candidates,
          ${sendRejections ? `📧 ${result.results.rejected} rejection emails sent` : ''}
          ${result.results.failed.length > 0 ? `⚠️ ${result.results.failed.length} failed` : ''}`
        );
        
        if (onPublishComplete) {
          onPublishComplete(result.results);
        }
        
        onClose();
      } else {
        message.error('Failed to publish results: ' + result.message);
      }
    } catch (error) {
      console.error('Error publishing results:', error);
      message.error('An error occurred while publishing results');
    } finally {
      setIsPublishing(false);
    }
  };

  const handlePreview = (candidate) => {
    setPreviewCandidate(candidate);
  };

  const getCandidateList = () => {
    switch (publishType) {
      case 'shortlisted':
        return shortlistedCandidates;
      case 'all':
        return completedCandidates;
      case 'selected':
        return validCandidates.filter(c => selectedCandidates.includes(c.id));
      default:
        return shortlistedCandidates;
    }
  };

  return (
    <>
      <Modal
        open={visible}
        onCancel={onClose}
        footer={null}
        width={800}
        className="result-publish-modal"
        destroyOnClose
      >
        <div className="publish-modal-content">
          {/* Header */}
          <div className="publish-header">
            <div className="publish-header-icon">
              <SendOutlined />
            </div>
            <div>
              <Title level={3} style={{ margin: 0, color: '#e0e7ff' }}>
                Publish Interview Results
              </Title>
              <Text style={{ color: '#94a3b8' }}>
                Send result notifications to candidates via email
              </Text>
            </div>
          </div>

          <Divider style={{ borderColor: 'rgba(88, 166, 255, 0.2)' }} />

          {/* Statistics */}
          <div className="publish-stats">
            <div className="stat-item shortlisted">
              <CheckCircleOutlined style={{ fontSize: '24px' }} />
              <div>
                <div className="stat-value">{shortlistedCandidates.length}</div>
                <div className="stat-label">Shortlisted (≥60)</div>
              </div>
            </div>
            <div className="stat-item rejected">
              <CloseCircleOutlined style={{ fontSize: '24px' }} />
              <div>
                <div className="stat-value">{rejectedCandidates.length}</div>
                <div className="stat-label">Not Shortlisted (&lt;60)</div>
              </div>
            </div>
            <div className="stat-item total">
              <ThunderboltOutlined style={{ fontSize: '24px' }} />
              <div>
                <div className="stat-value">{completedCandidates.length}</div>
                <div className="stat-label">Total Completed</div>
              </div>
            </div>
          </div>

          <Divider style={{ borderColor: 'rgba(88, 166, 255, 0.2)' }} />

          {/* Publish Options */}
          <div className="publish-options">
            <Title level={5} style={{ color: '#e0e7ff', marginBottom: '16px' }}>
              Select Recipients
            </Title>
            
            <Radio.Group 
              value={publishType} 
              onChange={(e) => setPublishType(e.target.value)}
              className="publish-radio-group"
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Radio value="shortlisted" className="publish-radio">
                  <div className="radio-content">
                    <div className="radio-title">
                      <CheckCircleOutlined style={{ color: '#4ade80' }} />
                      Shortlisted Candidates Only (Score ≥ 60)
                    </div>
                    <div className="radio-description">
                      Send congratulatory emails to {shortlistedCandidates.length} shortlisted candidates
                    </div>
                  </div>
                </Radio>

                <Radio value="all" className="publish-radio">
                  <div className="radio-content">
                    <div className="radio-title">
                      <MailOutlined style={{ color: '#58a6ff' }} />
                      All Completed Candidates
                    </div>
                    <div className="radio-description">
                      Send results to all {completedCandidates.length} candidates who completed the interview
                    </div>
                  </div>
                </Radio>

                <Radio value="selected" className="publish-radio">
                  <div className="radio-content">
                    <div className="radio-title">
                      <InfoCircleOutlined style={{ color: '#fbbf24' }} />
                      Custom Selection
                    </div>
                    <div className="radio-description">
                      Manually select specific candidates to notify
                    </div>
                  </div>
                </Radio>
              </Space>
            </Radio.Group>

            {/* Custom Selection */}
            {publishType === 'selected' && (
              <div className="custom-selection" style={{ marginTop: '16px' }}>
                <Checkbox.Group 
                  value={selectedCandidates}
                  onChange={setSelectedCandidates}
                  style={{ width: '100%' }}
                >
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    {completedCandidates.map(candidate => (
                      <Checkbox key={candidate.id} value={candidate.id} className="candidate-checkbox">
                        <div className="checkbox-content">
                          <span className="candidate-name">{candidate.name}</span>
                          <Tag color={(candidate.finalScore || 0) >= 60 ? 'green' : 'red'}>
                            Score: {candidate.finalScore || 0}
                          </Tag>
                        </div>
                      </Checkbox>
                    ))}
                  </Space>
                </Checkbox.Group>
              </div>
            )}
          </div>

          <Divider style={{ borderColor: 'rgba(88, 166, 255, 0.2)' }} />

          {/* Info Alert */}
          <Alert
            message="Publishing Results"
            description={
              <div>
                <p style={{ marginBottom: '8px' }}>When you publish results, the following will happen:</p>
                <ul style={{ marginLeft: '16px', marginBottom: 0 }}>
                  <li>📊 <strong>Scores will become visible</strong> to interviewees on their completion screen</li>
                  <li>📧 Email notifications will be sent to selected candidates</li>
                  <li>✅ Shortlisted candidates receive congratulatory emails with their scores</li>
                  {sendRejections && <li>❌ Rejected candidates receive polite rejection emails (optional)</li>}
                </ul>
              </div>
            }
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
            style={{ marginBottom: '16px' }}
          />

          {/* Additional Options */}
          <div className="additional-options">
            <Checkbox 
              checked={sendRejections}
              onChange={(e) => setSendRejections(e.target.checked)}
              className="rejection-checkbox"
            >
              <div className="checkbox-label">
                <span>Also send rejection emails to candidates below 60</span>
                <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
                  Send polite rejection emails to {rejectedCandidates.length} candidates
                </Text>
              </div>
            </Checkbox>
          </div>

          <Divider style={{ borderColor: 'rgba(88, 166, 255, 0.2)' }} />

          {/* Preview Section */}
          <div className="preview-section">
            <Title level={5} style={{ color: '#e0e7ff', marginBottom: '16px' }}>
              Candidates to Notify ({getCandidateList().length})
            </Title>
            
            <List
              className="candidates-preview-list"
              dataSource={getCandidateList().slice(0, 5)}
              renderItem={(candidate) => (
                <List.Item className="candidate-preview-item">
                  <div className="candidate-info">
                    <div className="candidate-details">
                      <span className="candidate-name">{candidate.name}</span>
                      <span className="candidate-email">{candidate.email}</span>
                    </div>
                    <div className="candidate-score">
                      <Progress 
                        type="circle" 
                        percent={candidate.finalScore || 0} 
                        width={50}
                        strokeColor={
                          (candidate.finalScore || 0) >= 85 ? '#4ade80' :
                          (candidate.finalScore || 0) >= 70 ? '#58a6ff' :
                          (candidate.finalScore || 0) >= 60 ? '#fbbf24' : '#f87171'
                        }
                      />
                    </div>
                    <Button
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => handlePreview(candidate)}
                      className="preview-btn"
                    >
                      Preview Email
                    </Button>
                  </div>
                </List.Item>
              )}
            />
            
            {getCandidateList().length > 5 && (
              <Text style={{ color: '#64748b', fontSize: '12px', marginTop: '8px', display: 'block' }}>
                + {getCandidateList().length - 5} more candidates
              </Text>
            )}
          </div>

          {/* Alert */}
          <Alert
            message="Email Notification"
            description={`You are about to send result notifications to ${getCandidateList().length} candidate(s). ${sendRejections ? 'Rejection emails will also be sent to candidates below 60.' : 'Only shortlisted candidates will be notified.'} This action cannot be undone.`}
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
            style={{ 
              marginTop: '16px',
              background: 'rgba(88, 166, 255, 0.1)',
              border: '1px solid rgba(88, 166, 255, 0.3)'
            }}
          />

          {/* Footer Actions */}
          <div className="publish-footer">
            <Button 
              size="large"
              onClick={onClose}
              className="cancel-btn"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<SendOutlined />}
              loading={isPublishing}
              onClick={handlePublish}
              disabled={publishType === 'selected' && selectedCandidates.length === 0}
              className="publish-btn"
            >
              {isPublishing ? 'Publishing...' : `Publish Results (${getCandidateList().length})`}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Email Preview Modal */}
      <Modal
        open={!!previewCandidate}
        onCancel={() => setPreviewCandidate(null)}
        footer={null}
        width={700}
        title="Email Preview"
        className="email-preview-modal"
      >
        {previewCandidate && (
          <div className="email-preview-content">
            <div className="email-header">
              <div className="email-subject">
                <MailOutlined style={{ color: '#58a6ff', marginRight: '8px' }} />
                {getEmailTemplate(
                  (previewCandidate.finalScore || 0) >= 60 ? 'shortlist' : 'rejection',
                  previewCandidate
                ).subject}
              </div>
              <div className="email-meta">
                <Text type="secondary">To: {previewCandidate.email}</Text>
              </div>
            </div>
            <Divider />
            <div className="email-body">
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', color: '#cbd5e1' }}>
                {getEmailTemplate(
                  (previewCandidate.finalScore || 0) >= 60 ? 'shortlist' : 'rejection',
                  previewCandidate
                ).preview}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default ResultPublishModal;
