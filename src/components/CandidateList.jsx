import React, { useState } from 'react';
import { Card, List, Avatar, Tag, Button, Space, Input, Select, Badge } from 'antd';
import { UserOutlined, SearchOutlined, EyeOutlined, DownloadOutlined, FilterOutlined } from '@ant-design/icons';

const { Search } = Input;
const { Option } = Select;

const CandidateList = ({ onSelectCandidate, candidates }) => {
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRole, setFilterRole] = useState('all');

  // Use provided candidates or fall back to mock data
  const mockCandidates = candidates || [
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'Software Engineer',
      status: 'completed',
      score: 85,
      interviewDate: '2025-09-28',
      avatar: null,
      resumeUrl: '/resumes/john-doe.pdf',
      totalQuestions: 10,
      answeredQuestions: 10,
      chatMessages: 45,
      tags: ['React', 'Node.js', 'MongoDB']
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      role: 'Data Scientist',
      status: 'in-progress',
      score: 72,
      interviewDate: '2025-09-29',
      avatar: null,
      resumeUrl: '/resumes/jane-smith.pdf',
      totalQuestions: 10,
      answeredQuestions: 7,
      chatMessages: 32,
      tags: ['Python', 'ML', 'TensorFlow']
    },
    {
      id: 3,
      name: 'Mike Johnson',
      email: 'mike.j@example.com',
      role: 'Product Manager',
      status: 'completed',
      score: 91,
      interviewDate: '2025-09-27',
      avatar: null,
      resumeUrl: '/resumes/mike-johnson.pdf',
      totalQuestions: 10,
      answeredQuestions: 10,
      chatMessages: 58,
      tags: ['Agile', 'Leadership', 'Strategy']
    },
    {
      id: 4,
      name: 'Sarah Williams',
      email: 'sarah.w@example.com',
      role: 'UX Designer',
      status: 'pending',
      score: null,
      interviewDate: '2025-09-30',
      avatar: null,
      resumeUrl: '/resumes/sarah-williams.pdf',
      totalQuestions: 10,
      answeredQuestions: 0,
      chatMessages: 0,
      tags: ['Figma', 'UI/UX', 'Design Systems']
    }
  ];

  const getStatusColor = (status) => {
    const colors = {
      completed: 'success',
      'in-progress': 'processing',
      pending: 'default',
      rejected: 'error'
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status) => {
    return status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const filteredCandidates = mockCandidates.filter(candidate => {
    const matchesSearch = candidate.name.toLowerCase().includes(searchText.toLowerCase()) ||
                         candidate.email.toLowerCase().includes(searchText.toLowerCase()) ||
                         candidate.role.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = filterStatus === 'all' || candidate.status === filterStatus;
    const matchesRole = filterRole === 'all' || candidate.role === filterRole;
    return matchesSearch && matchesStatus && matchesRole;
  });

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
          Candidate Management
        </h2>
        <p style={{ color: '#8c8c8c', marginBottom: '24px' }}>
          View and manage all candidate interviews, profiles, and AI assessments
        </p>

        {/* Filters */}
        <Space size="middle" style={{ width: '100%', marginBottom: '16px' }} wrap>
          <Search
            placeholder="Search candidates by name, email, or role..."
            allowClear
            style={{ width: 300 }}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
          />
          
          <Select
            defaultValue="all"
            style={{ width: 150 }}
            onChange={setFilterStatus}
            suffixIcon={<FilterOutlined />}
          >
            <Option value="all">All Status</Option>
            <Option value="completed">Completed</Option>
            <Option value="in-progress">In Progress</Option>
            <Option value="pending">Pending</Option>
            <Option value="rejected">Rejected</Option>
          </Select>

          <Select
            defaultValue="all"
            style={{ width: 180 }}
            onChange={setFilterRole}
          >
            <Option value="all">All Roles</Option>
            <Option value="Software Engineer">Software Engineer</Option>
            <Option value="Data Scientist">Data Scientist</Option>
            <Option value="Product Manager">Product Manager</Option>
            <Option value="UX Designer">UX Designer</Option>
          </Select>
        </Space>

        {/* Stats */}
        <Space size="large">
          <Badge count={mockCandidates.length} showZero color="#1890ff">
            <Card size="small" style={{ minWidth: 120 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                  {mockCandidates.length}
                </div>
                <div style={{ fontSize: '12px', color: '#8c8c8c' }}>Total</div>
              </div>
            </Card>
          </Badge>
          
          <Badge count={mockCandidates.filter(c => c.status === 'completed').length} showZero color="#52c41a">
            <Card size="small" style={{ minWidth: 120 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                  {mockCandidates.filter(c => c.status === 'completed').length}
                </div>
                <div style={{ fontSize: '12px', color: '#8c8c8c' }}>Completed</div>
              </div>
            </Card>
          </Badge>

          <Badge count={mockCandidates.filter(c => c.status === 'in-progress').length} showZero color="#faad14">
            <Card size="small" style={{ minWidth: 120 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14' }}>
                  {mockCandidates.filter(c => c.status === 'in-progress').length}
                </div>
                <div style={{ fontSize: '12px', color: '#8c8c8c' }}>In Progress</div>
              </div>
            </Card>
          </Badge>
        </Space>
      </div>

      {/* Candidate List */}
      <List
        grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 3 }}
        dataSource={filteredCandidates}
        renderItem={(candidate) => (
          <List.Item>
            <Card
              hoverable
              style={{
                borderRadius: '12px',
                border: '1px solid #f0f0f0',
                height: '100%'
              }}
              bodyStyle={{ padding: '20px' }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '16px' }}>
                <Avatar
                  size={64}
                  icon={<UserOutlined />}
                  src={candidate.avatar}
                  style={{ marginRight: '16px', backgroundColor: '#1890ff' }}
                />
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                    {candidate.name}
                  </h3>
                  <p style={{ margin: '4px 0', color: '#8c8c8c', fontSize: '14px' }}>
                    {candidate.email}
                  </p>
                  <Tag color="blue" style={{ marginTop: '4px' }}>
                    {candidate.role}
                  </Tag>
                </div>
                <Tag color={getStatusColor(candidate.status)}>
                  {getStatusText(candidate.status)}
                </Tag>
              </div>

              {/* Stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '16px',
                padding: '12px',
                backgroundColor: '#fafafa',
                borderRadius: '8px'
              }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c' }}>Interview Date</div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    {new Date(candidate.interviewDate).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c' }}>Score</div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    {candidate.score ? `${candidate.score}%` : 'N/A'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c' }}>Questions</div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    {candidate.answeredQuestions}/{candidate.totalQuestions}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c' }}>Messages</div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    {candidate.chatMessages}
                  </div>
                </div>
              </div>

              {/* Skills/Tags */}
              <div style={{ marginBottom: '16px' }}>
                <Space size={[4, 8]} wrap>
                  {candidate.tags.map(tag => (
                    <Tag key={tag} color="default" style={{ fontSize: '12px' }}>
                      {tag}
                    </Tag>
                  ))}
                </Space>
              </div>

              {/* Actions */}
              <Space size="small" style={{ width: '100%' }}>
                <Button
                  type="primary"
                  icon={<EyeOutlined />}
                  onClick={() => onSelectCandidate(candidate)}
                  block
                >
                  View Details
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() => window.open(candidate.resumeUrl, '_blank')}
                >
                  Resume
                </Button>
              </Space>
            </Card>
          </List.Item>
        )}
      />

      {filteredCandidates.length === 0 && (
        <Card style={{ textAlign: 'center', padding: '40px' }}>
          <UserOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
          <h3 style={{ color: '#8c8c8c' }}>No candidates found</h3>
          <p style={{ color: '#bfbfbf' }}>
            Try adjusting your search or filters
          </p>
        </Card>
      )}
    </div>
  );
};

export default CandidateList;
