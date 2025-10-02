import React, { useState, useMemo, useEffect } from 'react';
import { 
  Modal,
  Tabs,
  Button, 
  Typography, 
  Badge,
  Spin,
  Tooltip,
  Empty
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
  FallOutlined
} from '@ant-design/icons';
import { useInterviewStore } from '../store/useInterviewStore';
import CandidateProfile from '../components/CandidateProfile';
import ChatHistory from '../components/ChatHistory';
import AISummary from '../components/AISummary';
import styles from './InterviewerView.module.css';

const { Title, Text } = Typography;

const InterviewerView = () => {
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [sortBy, setSortBy] = useState('score');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [isLoading, setIsLoading] = useState(false);
  const { candidates } = useInterviewStore();

  // Filter and sort candidates
  const filteredAndSortedCandidates = useMemo(() => {
    let filtered = [...(candidates || [])];

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(c => c.status === filterStatus);
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
    const total = candidates?.length || 0;
    const completed = candidates?.filter(c => c.status === 'completed').length || 0;
    const inProgress = candidates?.filter(c => c.status === 'in-progress').length || 0;
    const avgScore = completed > 0 
      ? Math.round(candidates.filter(c => c.status === 'completed' && c.finalScore)
          .reduce((sum, c) => sum + c.finalScore, 0) / completed)
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
    // Mock export functionality
    console.log('Exporting data...');
  };

  const getScoreColor = (score) => {
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'average';
    return 'poor';
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
      <span className={`${styles.candidateStatus} ${styles[statusInfo.class]}`}>
        {statusInfo.label}
      </span>
    );
  };

  return (
    <div className={styles.interviewerDashboard}>
      {/* Dashboard Header */}
      <div className={styles.dashboardHeader}>
        <div className={styles.headerTop}>
          <div className={styles.headerTitle}>
            <TrophyOutlined className={styles.headerIcon} />
            <div>
              <h1>Interviewer Dashboard</h1>
              <Text type="secondary" style={{ fontSize: '16px' }}>
                Manage and evaluate candidates with AI-powered insights
              </Text>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.refreshButton} onClick={handleRefresh}>
              <ReloadOutlined spin={isLoading} />
              Refresh
            </button>
            <button className={styles.exportButton} onClick={handleExport}>
              <DownloadOutlined />
              Export Data
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.total}`}>
              <TeamOutlined />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Total Candidates</div>
              <div className={styles.statValue}>{statistics.total}</div>
              <div className={`${styles.statChange} ${styles.positive}`}>
                <RiseOutlined /> +{statistics.totalTrend}% from last month
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.completed}`}>
              <CheckCircleOutlined />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Completed</div>
              <div className={styles.statValue}>{statistics.completed}</div>
              <div className={`${styles.statChange} ${styles.positive}`}>
                <RiseOutlined /> +{statistics.completedTrend}% completion rate
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.inProgress}`}>
              <ClockCircleOutlined />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>In Progress</div>
              <div className={styles.statValue}>{statistics.inProgress}</div>
              <div className={styles.statChange}>
                <ThunderboltOutlined /> Currently active
              </div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.average}`}>
              <StarOutlined />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>Average Score</div>
              <div className={styles.statValue}>{statistics.avgScore}<Text style={{ fontSize: '20px', color: '#888' }}>/100</Text></div>
              <div className={`${styles.statChange} ${statistics.avgScoreTrend >= 0 ? styles.positive : styles.negative}`}>
                {statistics.avgScoreTrend >= 0 ? <RiseOutlined /> : <FallOutlined />}
                {statistics.avgScoreTrend >= 0 ? '+' : ''}{statistics.avgScoreTrend}% quality score
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className={styles.filtersSection}>
        <div className={styles.filtersGrid}>
          <div className={styles.searchBox}>
            <SearchOutlined className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search candidates by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className={styles.filterSelect}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">📋 All Status</option>
            <option value="completed">✅ Completed</option>
            <option value="in-progress">⏳ In Progress</option>
            <option value="pending">⏸️ Pending</option>
          </select>

          <select
            className={styles.sortSelect}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="score">🏆 Sort by Score</option>
            <option value="date">📅 Sort by Date</option>
            <option value="name">🔤 Sort by Name</option>
          </select>
        </div>
      </div>

      {/* Candidates Section */}
      <div className={styles.candidatesSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>
            <FireOutlined style={{ color: '#f59e0b' }} />
            Candidates ({filteredAndSortedCandidates.length})
            {sortBy === 'score' && <TrophyOutlined style={{ color: '#faad14' }} />}
          </div>
          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewButton} ${viewMode === 'grid' ? styles.active : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <AppstoreOutlined /> Grid
            </button>
            <button
              className={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`}
              onClick={() => setViewMode('list')}
            >
              <BarsOutlined /> List
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className={styles.loadingContainer}>
            <Spin size="large" />
            <p className={styles.loadingText}>Loading candidates...</p>
          </div>
        ) : filteredAndSortedCandidates.length === 0 ? (
          <div className={styles.emptyState}>
            <InboxOutlined className={styles.emptyIcon} />
            <h3 className={styles.emptyTitle}>No Candidates Found</h3>
            <p className={styles.emptyText}>
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your filters or search terms'
                : 'Start by having candidates complete their interviews'}
            </p>
          </div>
        ) : (
          <div className={styles.candidatesGrid}>
            {filteredAndSortedCandidates.map((candidate, index) => (
              <div
                key={candidate.id || index}
                className={styles.candidateCard}
                onClick={() => handleSelectCandidate(candidate)}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className={styles.candidateHeader}>
                  <div className={styles.candidateAvatar}>
                    {getInitials(candidate.name)}
                  </div>
                  <div className={styles.candidateInfo}>
                    <Tooltip title={candidate.name}>
                      <div className={styles.candidateName}>{candidate.name || 'Unknown'}</div>
                    </Tooltip>
                    <div className={styles.candidateRole}>
                      {candidate.role || 'Full Stack Developer'}
                    </div>
                    {getStatusBadge(candidate.status)}
                  </div>
                </div>

                <div className={styles.candidateScore}>
                  <div className={`${styles.scoreCircle} ${styles[getScoreColor(candidate.finalScore || 0)]}`}>
                    {candidate.finalScore || 0}
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                      Overall Score
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                      {candidate.finalScore >= 85 ? '⭐ Excellent' :
                       candidate.finalScore >= 70 ? '✓ Very Good' :
                       candidate.finalScore >= 50 ? '○ Good' : '⚠️ Fair'}
                    </div>
                  </div>
                </div>

                <div className={styles.candidateMetrics}>
                  <div className={styles.metricItem}>
                    <div className={styles.metricValue}>
                      {candidate.answeredQuestions || 0}/6
                    </div>
                    <div className={styles.metricLabel}>Questions</div>
                  </div>
                  <div className={styles.metricItem}>
                    <div className={styles.metricValue}>
                      {candidate.chatMessages || 0}
                    </div>
                    <div className={styles.metricLabel}>Messages</div>
                  </div>
                  <div className={styles.metricItem}>
                    <div className={styles.metricValue}>
                      {candidate.skills?.length || 0}
                    </div>
                    <div className={styles.metricLabel}>Skills</div>
                  </div>
                </div>

                <div className={styles.candidateFooter}>
                  <div className={styles.candidateDate}>
                    <CalendarOutlined style={{ marginRight: '6px' }} />
                    {formatDate(candidate.interviewDate || candidate.createdAt)}
                  </div>
                  <button className={styles.viewDetailsButton}>
                    View Details
                    <ArrowRightOutlined />
                  </button>
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
        className={styles.detailModal}
        destroyOnClose
      >
        {selectedCandidate && (
          <>
            {/* Modal Header */}
            <div className={styles.detailModalHeader}>
              <div className={styles.detailCandidateInfo}>
                <div className={styles.detailAvatar}>
                  {getInitials(selectedCandidate.name)}
                </div>
                <div className={styles.detailInfo}>
                  <h2>{selectedCandidate.name}</h2>
                  <p>
                    <MailOutlined /> {selectedCandidate.email} • 
                    <PhoneOutlined style={{ marginLeft: '12px' }} /> {selectedCandidate.phone}
                  </p>
                </div>
              </div>
              <div className={styles.detailScore}>
                <div className={styles.detailScoreValue}>{selectedCandidate.finalScore || 0}</div>
                <div className={styles.detailScoreLabel}>Overall Score</div>
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
                      <RobotOutlined /> AI Analysis
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
              justifyContent: 'flex-end'
            }}>
              <Button
                size="large"
                icon={<DownloadOutlined />}
              >
                Download Resume
              </Button>
              <Button
                size="large"
                icon={<MailOutlined />}
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
          </>
        )}
      </Modal>
    </div>
  );
};

export default InterviewerView;
