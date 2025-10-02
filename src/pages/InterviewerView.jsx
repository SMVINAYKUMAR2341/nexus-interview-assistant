import React, { useState, useMemo, useEffect } from 'react';
import { 
  Modal,
  Tabs,
  Button, 
  Typography, 
  Badge,
  Spin,
  Tooltip,
  Empty,
  Row,
  Col
} from 'antd';
import { 
  UserOutlined,
  MessageOutlined,
  FileTextOutlined,
  RobotOutlined,
  TrophyOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
  ArrowRightOutlined,
  CalendarOutlined,
  MailOutlined,
  PhoneOutlined,
  StarOutlined,
  FireOutlined,
  ThunderboltOutlined,
  InboxOutlined,
  FilterOutlined,
  AppstoreOutlined,
  BarsOutlined,
  RiseOutlined,
  FallOutlined,
  RedoOutlined,
  ExclamationCircleOutlined,
  RocketOutlined,
  ExportOutlined
} from '@ant-design/icons';
import { useInterviewStore } from '../store/useInterviewStore';
import CandidateProfile from '../components/CandidateProfile';
import ChatHistory from '../components/ChatHistory';
import AISummary from '../components/AISummary';
import ResumeAnalysis from '../components/ResumeAnalysis';
import ResultPublishModal from '../components/ResultPublishModal';
import '../styles/InterviewerNeon.css';

const { Title, Text } = Typography;

const InterviewerView = () => {
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [sortBy, setSortBy] = useState('score');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [isLoading, setIsLoading] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const { candidates = [], resetCandidateAssessment } = useInterviewStore();
  
  console.log('InterviewerView - Candidates:', candidates);

  // Filter and sort candidates
  const filteredAndSortedCandidates = useMemo(() => {
    console.log('Filtering candidates:', { total: candidates.length, filterStatus, searchTerm });
    let filtered = [...candidates];

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(c => c && c.status === filterStatus);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm)
      );
    }

    // Sort candidates
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return (b.finalScore || 0) - (a.finalScore || 0);
        case 'date':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [candidates, sortBy, filterStatus, searchTerm]);

  // Calculate statistics
  const statistics = useMemo(() => {
    console.log('Calculating statistics for candidates:', candidates);
    const total = candidates.length;
    const completed = candidates.filter(c => c && c.status === 'completed').length;
    const inProgress = candidates.filter(c => c && c.status === 'in-progress').length;
    const avgScore = completed > 0 
      ? Math.round(candidates.filter(c => c && c.status === 'completed' && c.finalScore)
          .reduce((sum, c) => sum + (c.finalScore || 0), 0) / completed)
      : 0;

    // Calculate trends (mock - in real app, compare with previous period)
    const totalTrend = 12; // +12%
    const completedTrend = 8; // +8%
    const avgScoreTrend = -3; // -3%

    return { 
      total, 
      completed, 
      inProgress, 
      avgScore,
      totalTrend,
      completedTrend,
      avgScoreTrend
    };
  }, [candidates]);

  const handleSelectCandidate = (candidate) => {
    setSelectedCandidate(candidate);
    setActiveTab('profile');
  };

  const handleCloseModal = () => {
    setSelectedCandidate(null);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handleExport = () => {
    try {
      const candidates = useInterviewStore.getState().candidates;
      
      if (!candidates || candidates.length === 0) {
        Modal.warning({
          title: 'No Data to Export',
          content: 'There are no candidates to export. Please ensure candidates have completed their interviews.',
          okText: 'Got it',
        });
        return;
      }

      // Create modal to choose export format
      Modal.confirm({
        title: 'Export Candidate Data',
        icon: <ExportOutlined style={{ color: '#58a6ff' }} />,
        content: (
          <div style={{ marginTop: 16 }}>
            <p>Choose export format:</p>
            <p style={{ color: '#666', fontSize: '14px' }}>
              • CSV - Optimized for Excel/Google Sheets<br />
              • JSON - Complete data with full structure
            </p>
          </div>
        ),
        okText: 'Export as CSV',
        cancelText: 'Export as JSON',
        okButtonProps: { style: { background: '#58a6ff' } },
        cancelButtonProps: { style: { background: '#7c3aed', color: 'white' } },
        onOk: () => exportToCSV(candidates),
        onCancel: () => exportToJSON(candidates),
      });
    } catch (error) {
      console.error('Export error:', error);
      Modal.error({
        title: 'Export Failed',
        content: 'An error occurred while exporting data. Please try again.',
      });
    }
  };

  const exportToCSV = (candidates) => {
    try {
      // CSV headers
      const headers = [
        'Name',
        'Email',
        'Role',
        'Status',
        'Interview Date',
        'Final Score',
        'Questions Answered',
        'ATS Score',
        'Phone',
        'Location',
        'LinkedIn',
        'GitHub',
        'Skills',
        'Experience',
        'Education'
      ];

      // Convert candidates to CSV rows
      const rows = candidates.map(candidate => [
        candidate.name || '',
        candidate.email || '',
        candidate.role || '',
        candidate.status || '',
        candidate.createdAt ? new Date(candidate.createdAt).toLocaleDateString() : '',
        candidate.finalScore || 0,
        `${candidate.answeredQuestions || 0}/${candidate.totalQuestions || 0}`,
        candidate.atsScore || 0,
        candidate.phone || '',
        candidate.location || '',
        candidate.linkedin || '',
        candidate.github || '',
        candidate.skills ? candidate.skills.join('; ') : '',
        candidate.experience || '',
        candidate.education || ''
      ]);

      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `interview-candidates-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      message.success(`Successfully exported ${candidates.length} candidates to CSV!`);
    } catch (error) {
      console.error('CSV export error:', error);
      message.error('Failed to export CSV file');
    }
  };

  const exportToJSON = (candidates) => {
    try {
      // Create comprehensive JSON export
      const exportData = {
        exportDate: new Date().toISOString(),
        totalCandidates: candidates.length,
        completedInterviews: candidates.filter(c => c.status === 'completed').length,
        averageScore: candidates.reduce((sum, c) => sum + (c.finalScore || 0), 0) / candidates.length || 0,
        candidates: candidates.map(candidate => ({
          id: candidate.id,
          personalInfo: {
            name: candidate.name,
            email: candidate.email,
            phone: candidate.phone,
            location: candidate.location,
            linkedin: candidate.linkedin,
            github: candidate.github,
            website: candidate.website
          },
          interviewData: {
            role: candidate.role,
            status: candidate.status,
            interviewDate: candidate.createdAt,
            finalScore: candidate.finalScore || 0,
            atsScore: candidate.atsScore || 0,
            questionsAnswered: candidate.answeredQuestions || 0,
            totalQuestions: candidate.totalQuestions || 0,
            timeSpent: candidate.totalTimeSpent || 0
          },
          professionalInfo: {
            skills: candidate.skills || [],
            experience: candidate.experience,
            education: candidate.education,
            projects: candidate.projects || []
          },
          answers: candidate.answers || [],
          resumeData: candidate.resumeData || null
        }))
      };

      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `interview-candidates-${new Date().toISOString().split('T')[0]}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      message.success(`Successfully exported ${candidates.length} candidates to JSON!`);
    } catch (error) {
      console.error('JSON export error:', error);
      message.error('Failed to export JSON file');
    }
  };

  const handlePublishResults = () => {
    setShowPublishModal(true);
  };

  const handlePublishComplete = (results) => {
    console.log('Published results:', results);
    // You can update candidate status or refresh data here
  };

  const handleResetAssessment = (candidate) => {
    Modal.confirm({
      title: 'Reset Assessment',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>Are you sure you want to reset the assessment for <strong>{candidate.name}</strong>?</p>
          <p style={{ color: '#f59e0b', marginTop: '8px' }}>
            ⚠️ This will permanently delete:
          </p>
          <ul style={{ color: '#94a3b8', marginTop: '8px' }}>
            <li>All chat history</li>
            <li>All answers and scores</li>
            <li>Final evaluation and summary</li>
          </ul>
          <p style={{ marginTop: '8px' }}>The candidate will be able to retake the assessment from the beginning.</p>
        </div>
      ),
      okText: 'Yes, Reset Assessment',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk() {
        resetCandidateAssessment(candidate.id);
        Modal.success({
          title: 'Assessment Reset',
          content: `Assessment for ${candidate.name} has been reset successfully. They can now retake the test.`,
        });
      },
    });
  };

  const handleDownloadResume = (candidate) => {
    if (!candidate) {
      Modal.error({
        title: 'No Candidate Selected',
        content: 'Please select a candidate to download their resume.',
      });
      return;
    }

    // Check if resume data exists
    if (!candidate.resumeData) {
      Modal.warning({
        title: 'No Resume Available',
        content: `${candidate.name} has not uploaded a resume yet.`,
      });
      return;
    }

    try {
      // If resumeData contains file information
      if (candidate.resumeData.fileName && candidate.resumeData.rawText) {
        // Generate a text file with resume content
        const resumeContent = `
RESUME - ${candidate.name}
Email: ${candidate.email}
Phone: ${candidate.phone}
Date: ${new Date().toLocaleDateString()}

========================================

${candidate.resumeData.rawText}

========================================
Generated by NEXUS Interview Platform
        `.trim();

        const blob = new Blob([resumeContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${candidate.name.replace(/\s+/g, '_')}_Resume.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        Modal.success({
          title: 'Resume Downloaded',
          content: `Resume for ${candidate.name} has been downloaded successfully.`,
        });
      } else {
        // Fallback: generate a basic resume file
        const basicResume = `
CANDIDATE INFORMATION

Name: ${candidate.name}
Email: ${candidate.email}
Phone: ${candidate.phone}
Status: ${candidate.status}
Applied Date: ${new Date(candidate.createdAt).toLocaleDateString()}
Final Score: ${candidate.finalScore || 'Not yet evaluated'}

Note: Full resume content not available. This is a basic candidate information export.

Generated by NEXUS Interview Platform
        `.trim();

        const blob = new Blob([basicResume], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${candidate.name.replace(/\s+/g, '_')}_Info.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        Modal.info({
          title: 'Candidate Information Downloaded',
          content: 'Basic candidate information has been downloaded as resume is not available.',
        });
      }
    } catch (error) {
      console.error('Error downloading resume:', error);
      Modal.error({
        title: 'Download Failed',
        content: 'Failed to download resume. Please try again.',
      });
    }
  };

  const getScoreColor = (score) => {
    // Score is out of 30 (6 questions × 5 points)
    const percentage = (score / 30) * 100;
    if (percentage >= 80) return 'excellent'; // 24+/30
    if (percentage >= 60) return 'good';      // 18+/30
    if (percentage >= 40) return 'average';   // 12+/30
    return 'poor';                             // <12/30
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'completed': { label: 'Completed', class: 'completed' },
      'in-progress': { label: 'In Progress', class: 'inProgress' },
      'pending': { label: 'Pending', class: 'pending' }
    };
    const statusInfo = statusMap[status] || statusMap['pending'];
    return (
      <span className={`candidate-status status-${statusInfo.class}`}>
        {statusInfo.label}
      </span>
    );
  };

  // Safety check for rendering
  if (!candidates) {
    console.error('Candidates is null or undefined');
    return (
      <div className="interviewer-container" style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Loading candidates...</h2>
      </div>
    );
  }

  return (
    <div className="interviewer-container">
      {/* Dashboard Header */}
      <div className="neon-dashboard-header">
        <div className="neon-header-top">
          <div className="neon-header-title">
            <TrophyOutlined className="neon-header-icon" />
            <div>
              <h1>AI Interviewer Dashboard</h1>
              <div className="neon-header-subtitle">
                🤖 Manage and evaluate candidates with AI-powered insights
              </div>
            </div>
          </div>
          <div className="neon-header-actions">
            <button className="neon-action-btn secondary" onClick={handleRefresh}>
              <ReloadOutlined spin={isLoading} />
              Refresh
            </button>
            <button className="neon-action-btn secondary" onClick={handleExport}>
              <DownloadOutlined />
              Export Data
            </button>
            <button className="neon-action-btn primary publish-results-btn" onClick={handlePublishResults}>
              <MailOutlined />
              Publish Results
              {candidates?.filter(c => c.status === 'completed' && ((c.finalScore || 0) / 30 * 100) >= 60).length > 0 && (
                <Badge 
                  count={candidates.filter(c => c.status === 'completed' && ((c.finalScore || 0) / 30 * 100) >= 60).length} 
                  style={{ 
                    marginLeft: '8px',
                    background: '#4ade80',
                    boxShadow: '0 0 10px rgba(74, 222, 128, 0.5)'
                  }}
                />
              )}
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="neon-stats-grid">
          <div className="neon-stat-card total">
            <div className="neon-stat-icon">
              <TeamOutlined />
            </div>
            <div className="neon-stat-content">
              <div className="neon-stat-label">Total Candidates</div>
              <div className="neon-stat-value">{statistics.total}</div>
            </div>
          </div>

          <div className="neon-stat-card completed">
            <div className="neon-stat-icon">
              <CheckCircleOutlined />
            </div>
            <div className="neon-stat-content">
              <div className="neon-stat-label">Completed</div>
              <div className="neon-stat-value">{statistics.completed}</div>
            </div>
          </div>

          <div className="neon-stat-card inProgress">
            <div className="neon-stat-icon">
              <ClockCircleOutlined />
            </div>
            <div className="neon-stat-content">
              <div className="neon-stat-label">In Progress</div>
              <div className="neon-stat-value">{statistics.inProgress}</div>
            </div>
          </div>

          <div className="neon-stat-card average">
            <div className="neon-stat-icon">
              <StarOutlined />
            </div>
            <div className="neon-stat-content">
              <div className="neon-stat-label">Average Score</div>
              <div className="neon-stat-value">
                {statistics.avgScore}<small>/100</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="neon-filters-section">
        <div className="neon-filters-grid">
          <div className="neon-search-box">
            <SearchOutlined className="neon-search-icon" />
            <input
              type="text"
              className="neon-search-input"
              placeholder="🔍 Search candidates by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="neon-filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">📋 All Status</option>
            <option value="completed">✅ Completed</option>
            <option value="in-progress">⏳ In Progress</option>
            <option value="pending">⏸️ Pending</option>
          </select>

          <select
            className="neon-filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="score">🏆 Sort by Score</option>
            <option value="date">📅 Sort by Date</option>
            <option value="name">🔤 Sort by Name</option>
          </select>
        </div>
      </div>

      {/* Resume Upload Overview - Quick Stats */}
      <div className="neon-resume-overview">
        <div className="overview-header">
          <div className="overview-title">
            <FileTextOutlined style={{ fontSize: '24px', color: '#58a6ff' }} />
            <div>
              <h3>📄 Resume Analytics</h3>
              <p>AI-powered resume analysis for all candidates</p>
            </div>
          </div>
          <Button 
            icon={<ThunderboltOutlined />}
            className="neon-action-btn primary"
            onClick={() => {
              // Find first completed candidate and open their resume tab
              const completed = filteredAndSortedCandidates.find(c => c.status === 'completed');
              if (completed) {
                setSelectedCandidate(completed);
                setActiveTab('resume');
              }
            }}
          >
            View All Resumes
          </Button>
        </div>

        <Row gutter={[16, 16]} style={{ marginTop: '20px' }}>
          <Col xs={24} sm={12} md={6}>
            <div className="quick-stat-card">
              <div className="stat-icon-small" style={{ background: 'linear-gradient(135deg, #58a6ff, #7c3aed)' }}>
                <FileTextOutlined />
              </div>
              <div className="stat-info-small">
                <div className="stat-value-small">{candidates?.length || 0}</div>
                <div className="stat-label-small">Resumes Uploaded</div>
              </div>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div className="quick-stat-card">
              <div className="stat-icon-small" style={{ background: 'linear-gradient(135deg, #4ade80, #22c55e)' }}>
                <CheckCircleOutlined />
              </div>
              <div className="stat-info-small">
                <div className="stat-value-small">
                  {Math.round((candidates?.reduce((sum, c) => sum + (c.atsScore || 80), 0) / (candidates?.length || 1)))}%
                </div>
                <div className="stat-label-small">Avg ATS Score</div>
              </div>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div className="quick-stat-card">
              <div className="stat-icon-small" style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}>
                <StarOutlined />
              </div>
              <div className="stat-info-small">
                <div className="stat-value-small">
                  {candidates?.filter(c => ((c.finalScore || 0) / 30 * 100) >= 80).length || 0}
                </div>
                <div className="stat-label-small">High Performers</div>
              </div>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div className="quick-stat-card">
              <div className="stat-icon-small" style={{ background: 'linear-gradient(135deg, #ff6bed, #ec4899)' }}>
                <RocketOutlined />
              </div>
              <div className="stat-info-small">
                <div className="stat-value-small">
                  {candidates?.filter(c => c.status === 'completed').length || 0}
                </div>
                <div className="stat-label-small">AI Analyzed</div>
              </div>
            </div>
          </Col>
        </Row>
      </div>

      {/* Candidates Section */}
      <div className="neon-candidates-section">
        <div className="neon-section-header">
          <div className="neon-section-title">
            <FireOutlined style={{ color: '#f59e0b' }} />
            Candidates ({filteredAndSortedCandidates.length})
            {sortBy === 'score' && <TrophyOutlined style={{ color: '#faad14' }} />}
          </div>
          <div className="neon-view-toggle">
            <button
              className={`neon-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <AppstoreOutlined /> Grid
            </button>
            <button
              className={`neon-view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <BarsOutlined /> List
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="neon-loading-container">
            <div className="neon-loading-spinner">
              <ReloadOutlined spin />
            </div>
            <p className="neon-loading-text">⚡ Loading candidates...</p>
          </div>
        ) : filteredAndSortedCandidates.length === 0 ? (
          <div className="neon-empty-state">
            <div className="neon-empty-icon">
              <InboxOutlined />
            </div>
            <h3 className="neon-empty-title">No Candidates Found</h3>
            <p className="neon-empty-text">
              {searchTerm || filterStatus !== 'all'
                ? '🔍 Try adjusting your filters or search terms'
                : '🚀 Start by having candidates complete their interviews'}
            </p>
          </div>
        ) : (
          <div className="neon-candidates-grid">
            {filteredAndSortedCandidates.map((candidate, index) => (
              <div
                key={candidate.id || index}
                className="neon-candidate-card"
                onClick={() => handleSelectCandidate(candidate)}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="neon-candidate-header">
                  <div className="neon-candidate-avatar">
                    {getInitials(candidate.name)}
                    {candidate.resumeData && (
                      <Tooltip title="Resume Uploaded">
                        <div className="resume-badge">
                          <FileTextOutlined />
                        </div>
                      </Tooltip>
                    )}
                  </div>
                  <div className="neon-candidate-info">
                    <Tooltip title={candidate.name}>
                      <div className="neon-candidate-name">{candidate.name || 'Unknown'}</div>
                    </Tooltip>
                    <div className="neon-candidate-role">
                      {candidate.role || 'Full Stack Developer'}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span className={`neon-status-badge ${candidate.status === 'completed' ? 'completed' : candidate.status === 'in-progress' ? 'inProgress' : 'pending'}`}>
                        {candidate.status === 'completed' ? '✅ Completed' : candidate.status === 'in-progress' ? '⏳ In Progress' : '⏸️ Pending'}
                      </span>
                      {candidate.atsScore && (
                        <Tooltip title={`ATS Score: ${candidate.atsScore}%`}>
                          <span className="ats-mini-badge">
                            <FileTextOutlined style={{ fontSize: '10px' }} /> {candidate.atsScore}%
                          </span>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                </div>

                <div className="neon-candidate-score">
                  <div className={`neon-score-circle ${getScoreColor(candidate.finalScore || 0)}`}>
                    {(candidate.finalScore || 0).toFixed(1)}/30
                  </div>
                  <div className="neon-score-info">
                    <div className="neon-score-label">
                      Overall Score
                    </div>
                    <div className="neon-score-rating">
                      {(candidate.finalScore / 30 * 100) >= 80 ? '⭐ Excellent' :
                       (candidate.finalScore / 30 * 100) >= 60 ? '✨ Very Good' :
                       (candidate.finalScore / 30 * 100) >= 40 ? '✓ Good' : '⚠️ Fair'}
                    </div>
                  </div>
                </div>

                <div className="neon-candidate-metrics">
                  <div className="neon-metric-item">
                    <div className="neon-metric-value">
                      {candidate.answeredQuestions || 0}/6
                    </div>
                    <div className="neon-metric-label">Questions</div>
                  </div>
                  <div className="neon-metric-item">
                    <div className="neon-metric-value">
                      {candidate.chatMessages || 0}
                    </div>
                    <div className="neon-metric-label">Messages</div>
                  </div>
                  <div className="neon-metric-item">
                    <div className="neon-metric-value">
                      {candidate.skills?.length || 0}
                    </div>
                    <div className="neon-metric-label">Skills</div>
                  </div>
                </div>

                <div className="neon-candidate-footer">
                  <div className="neon-candidate-date">
                    <CalendarOutlined />
                    {formatDate(candidate.interviewDate || candidate.createdAt)}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {(candidate.status === 'completed' || candidate.status === 'in-progress') && (
                      <Tooltip title="Reset Assessment">
                        <button 
                          className="neon-reset-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResetAssessment(candidate);
                          }}
                        >
                          <RedoOutlined />
                        </button>
                      </Tooltip>
                    )}
                    <button className="neon-view-details-btn">
                      View Details
                      <ArrowRightOutlined />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Candidate Detail Modal */}
      <Modal
        open={!!selectedCandidate}
        onCancel={handleCloseModal}
        footer={null}
        width={1200}
        className="neon-detail-modal"
        destroyOnClose
      >
        {selectedCandidate && (
          <>
            {/* Modal Header */}
            <div className="neon-detail-modal-header">
              <div className="neon-detail-candidate-info">
                <div className="neon-candidate-avatar">
                  {getInitials(selectedCandidate.name)}
                </div>
                <div className="neon-detail-info">
                  <h2>{selectedCandidate.name}</h2>
                  <p>
                    <MailOutlined /> {selectedCandidate.email} • 
                    <PhoneOutlined style={{ marginLeft: '12px' }} /> {selectedCandidate.phone}
                  </p>
                </div>
              </div>
              <div className="neon-detail-score">
                <div className="neon-detail-score-value">{(selectedCandidate.finalScore || 0).toFixed(1)}/30 ({Math.round((selectedCandidate.finalScore / 30) * 100)}%)</div>
                <div className="neon-detail-score-label">Overall Score</div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              size="large"
              style={{ marginTop: '24px' }}
              items={[
                {
                  key: 'profile',
                  label: (
                    <span>
                      <UserOutlined /> Profile
                    </span>
                  ),
                  children: <CandidateProfile candidate={selectedCandidate} />
                },
                {
                  key: 'resume',
                  label: (
                    <span>
                      <FileTextOutlined /> Resume Analysis
                      <Badge 
                        count="AI" 
                        style={{ 
                          marginLeft: '8px', 
                          background: 'linear-gradient(135deg, #58a6ff 0%, #7c3aed 100%)',
                          fontSize: '10px'
                        }}
                      />
                    </span>
                  ),
                  children: <ResumeAnalysis candidate={selectedCandidate} />
                },
                {
                  key: 'chat',
                  label: (
                    <span>
                      <MessageOutlined /> Interview Transcript
                      <Badge 
                        count={selectedCandidate.chatMessages || 0} 
                        style={{ marginLeft: '8px', backgroundColor: '#667eea' }}
                      />
                    </span>
                  ),
                  children: <ChatHistory candidate={selectedCandidate} />
                },
                {
                  key: 'summary',
                  label: (
                    <span>
                      <RobotOutlined /> AI Summary
                    </span>
                  ),
                  children: <AISummary candidate={selectedCandidate} />
                }
              ]}
            />

            {/* Modal Footer Actions */}
            <div style={{ 
              marginTop: '24px', 
              paddingTop: '24px', 
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              gap: '12px',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <Tooltip title="Reset this candidate's assessment so they can retake the interview">
                  <Button
                    danger
                    size="large"
                    icon={<RedoOutlined />}
                    onClick={() => handleResetAssessment(selectedCandidate)}
                  >
                    Reset Assessment
                  </Button>
                </Tooltip>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <Button
                  size="large"
                  icon={<DownloadOutlined />}
                  onClick={() => handleDownloadResume(selectedCandidate)}
                  style={{
                    borderColor: 'rgba(88, 166, 255, 0.4)',
                    color: '#58a6ff'
                  }}
                >
                  Download Resume
                </Button>
                <Button
                  size="large"
                  icon={<MailOutlined />}
                  style={{
                    borderColor: 'rgba(124, 58, 237, 0.4)',
                    color: '#7c3aed'
                  }}
                >
                  Send Email
                </Button>
                <Button
                  type="primary"
                  size="large"
                  icon={<CheckCircleOutlined />}
                  style={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none'
                  }}
                >
                  Mark as Hired
                </Button>
              </div>
            </div>
          </>
        )}
      </Modal>

      {/* Result Publish Modal */}
      <ResultPublishModal
        visible={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        candidates={candidates || []}
        onPublishComplete={handlePublishComplete}
      />
    </div>
  );
};

export default InterviewerView;
