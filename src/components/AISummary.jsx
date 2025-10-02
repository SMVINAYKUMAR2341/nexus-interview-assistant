import React from 'react';
import { Card, Progress, Tag, Space, Divider, List, Typography, Row, Col, Alert, Rate, Timeline } from 'antd';
import {
  TrophyOutlined,
  ThunderboltOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  BulbOutlined,
  StarOutlined,
  RocketOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const AISummary = ({ candidate }) => {
  if (!candidate) {
    return (
      <Card style={{ margin: '24px', textAlign: 'center', padding: '40px' }}>
        <BulbOutlined style={{ fontSize: '64px', color: '#d9d9d9', marginBottom: '16px' }} />
        <Title level={4} type="secondary">No AI Summary Available</Title>
        <Text type="secondary">Select a completed interview to view AI-generated summary</Text>
      </Card>
    );
  }

  // Mock AI-generated summary data
  const aiSummary = {
    overallScore: candidate.score || 85,
    recommendation: 'Highly Recommended',
    confidenceLevel: 92,
    summary: `${candidate.name} demonstrated strong technical expertise and excellent communication skills throughout the interview. The candidate showed deep understanding of full-stack development concepts, particularly in React, Node.js, and cloud technologies. Their responses were well-structured, thoughtful, and backed by practical experience.`,
    
    strengths: [
      {
        title: 'Technical Expertise',
        description: 'Demonstrated comprehensive knowledge of modern web development technologies and best practices.',
        score: 90,
        examples: ['Clear explanation of REST vs GraphQL', 'Solid understanding of React hooks and state management', 'Experience with cloud architecture and deployment']
      },
      {
        title: 'Problem-Solving Ability',
        description: 'Showed excellent analytical thinking and systematic approach to technical challenges.',
        score: 85,
        examples: ['Broke down complex problems into manageable steps', 'Considered multiple solutions before recommending', 'Demonstrated debugging methodology']
      },
      {
        title: 'Communication Skills',
        description: 'Articulated technical concepts clearly and concisely, suitable for both technical and non-technical audiences.',
        score: 88,
        examples: ['Used clear analogies to explain complex topics', 'Structured responses logically', 'Active listening and relevant follow-up questions']
      },
      {
        title: 'Leadership Experience',
        description: 'Proven track record of leading development teams and mentoring junior developers.',
        score: 82,
        examples: ['Managed team of 3 developers', 'Experience with code reviews and technical guidance', 'Demonstrated conflict resolution skills']
      }
    ],

    weaknesses: [
      {
        title: 'System Design at Scale',
        description: 'Could benefit from more experience with large-scale distributed systems architecture.',
        severity: 'medium',
        suggestions: ['Recommend system design courses or books', 'Pair with senior architect for learning', 'Provide opportunities to work on scalability projects']
      },
      {
        title: 'Testing Practices',
        description: 'Limited discussion of automated testing strategies and TDD practices.',
        severity: 'low',
        suggestions: ['Introduce to testing best practices', 'Provide training on Jest, Cypress, or similar tools', 'Assign testing-focused tasks initially']
      }
    ],

    technicalSkills: [
      { skill: 'React/Frontend', level: 90, assessment: 'Expert' },
      { skill: 'Node.js/Backend', level: 85, assessment: 'Advanced' },
      { skill: 'Database Design', level: 80, assessment: 'Advanced' },
      { skill: 'Cloud/DevOps', level: 75, assessment: 'Intermediate' },
      { skill: 'System Architecture', level: 70, assessment: 'Intermediate' },
      { skill: 'Testing', level: 65, assessment: 'Intermediate' }
    ],

    softSkills: [
      { skill: 'Communication', level: 88, assessment: 'Excellent' },
      { skill: 'Problem Solving', level: 85, assessment: 'Excellent' },
      { skill: 'Teamwork', level: 82, assessment: 'Very Good' },
      { skill: 'Leadership', level: 82, assessment: 'Very Good' },
      { skill: 'Adaptability', level: 80, assessment: 'Very Good' }
    ],

    interviewPerformance: [
      { metric: 'Response Quality', score: 85, feedback: 'Comprehensive and well-articulated answers' },
      { metric: 'Technical Accuracy', score: 90, feedback: 'Demonstrated solid technical knowledge' },
      { metric: 'Code Quality', score: 82, feedback: 'Clean, readable code with good practices' },
      { metric: 'Time Management', score: 88, feedback: 'Completed all questions within time limits' },
      { metric: 'Cultural Fit', score: 85, feedback: 'Values align well with company culture' }
    ],

    recommendations: [
      'Move forward to next interview round with senior technical lead',
      'Consider for senior engineer position based on demonstrated expertise',
      'Provide system design resources to address identified gap',
      'Schedule team fit interview to assess collaboration style'
    ],

    nextSteps: [
      { action: 'Schedule Technical Deep Dive', priority: 'high', timeline: 'Within 3 days' },
      { action: 'Share with Hiring Manager', priority: 'high', timeline: 'Immediately' },
      { action: 'Prepare System Design Exercise', priority: 'medium', timeline: 'Before next round' },
      { action: 'Team Culture Fit Interview', priority: 'medium', timeline: 'Within 1 week' }
    ]
  };

  const getRecommendationColor = (recommendation) => {
    if (recommendation === 'Highly Recommended') return 'success';
    if (recommendation === 'Recommended') return 'processing';
    if (recommendation === 'Consider') return 'warning';
    return 'error';
  };

  const getSeverityColor = (severity) => {
    if (severity === 'high') return 'error';
    if (severity === 'medium') return 'warning';
    return 'default';
  };

  const getSkillColor = (level) => {
    if (level >= 85) return '#52c41a';
    if (level >= 70) return '#1890ff';
    if (level >= 60) return '#faad14';
    return '#ff4d4f';
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Header Summary */}
      <Card style={{ marginBottom: '24px', borderRadius: '12px' }}>
        <Row gutter={24}>
          <Col xs={24} md={6} style={{ textAlign: 'center' }}>
            <Progress
              type="circle"
              percent={aiSummary.overallScore}
              width={120}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
              format={(percent) => (
                <div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{percent}</div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c' }}>Overall</div>
                </div>
              )}
            />
          </Col>

          <Col xs={24} md={18}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Title level={4} style={{ margin: 0 }}>AI-Generated Assessment Summary</Title>
                <Text type="secondary">Candidate: {candidate.name}</Text>
              </div>

              <Alert
                message={
                  <Space>
                    <StarOutlined />
                    <Text strong>{aiSummary.recommendation}</Text>
                  </Space>
                }
                description={
                  <Text>
                    AI Confidence Level: {aiSummary.confidenceLevel}% | 
                    Generated on {new Date().toLocaleDateString()}
                  </Text>
                }
                type={getRecommendationColor(aiSummary.recommendation)}
                showIcon
              />

              <Paragraph style={{ marginBottom: 0, fontSize: '14px', lineHeight: '1.6' }}>
                {aiSummary.summary}
              </Paragraph>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={[24, 24]}>
        {/* Strengths */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <TrophyOutlined style={{ color: '#52c41a' }} />
                Key Strengths
              </Space>
            }
            style={{ height: '100%', borderRadius: '12px' }}
          >
            <List
              dataSource={aiSummary.strengths}
              renderItem={strength => (
                <List.Item style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '16px' }}>
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <Title level={5} style={{ margin: 0 }}>
                        <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                        {strength.title}
                      </Title>
                      <Tag color="green">{strength.score}%</Tag>
                    </div>
                    <Paragraph style={{ marginBottom: '8px', color: '#595959' }}>
                      {strength.description}
                    </Paragraph>
                    <div style={{ marginLeft: '24px' }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>Examples:</Text>
                      <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                        {strength.examples.map((example, idx) => (
                          <li key={idx} style={{ fontSize: '12px', color: '#8c8c8c' }}>{example}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Areas for Improvement */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <WarningOutlined style={{ color: '#faad14' }} />
                Areas for Improvement
              </Space>
            }
            style={{ height: '100%', borderRadius: '12px' }}
          >
            <List
              dataSource={aiSummary.weaknesses}
              renderItem={weakness => (
                <List.Item style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '16px' }}>
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <Title level={5} style={{ margin: 0 }}>
                        <CloseCircleOutlined style={{ color: '#faad14', marginRight: '8px' }} />
                        {weakness.title}
                      </Title>
                      <Tag color={getSeverityColor(weakness.severity)}>
                        {weakness.severity.toUpperCase()}
                      </Tag>
                    </div>
                    <Paragraph style={{ marginBottom: '8px', color: '#595959' }}>
                      {weakness.description}
                    </Paragraph>
                    <div style={{ marginLeft: '24px' }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>Suggestions:</Text>
                      <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                        {weakness.suggestions.map((suggestion, idx) => (
                          <li key={idx} style={{ fontSize: '12px', color: '#8c8c8c' }}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Technical Skills Assessment */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <ThunderboltOutlined style={{ color: '#1890ff' }} />
                Technical Skills Assessment
              </Space>
            }
            style={{ borderRadius: '12px' }}
          >
            <List
              dataSource={aiSummary.technicalSkills}
              renderItem={skill => (
                <List.Item>
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <Text strong>{skill.skill}</Text>
                      <Tag color={getSkillColor(skill.level)}>{skill.assessment}</Tag>
                    </div>
                    <Progress
                      percent={skill.level}
                      strokeColor={getSkillColor(skill.level)}
                      size="small"
                    />
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Soft Skills Assessment */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <BulbOutlined style={{ color: '#722ed1' }} />
                Soft Skills Assessment
              </Space>
            }
            style={{ borderRadius: '12px' }}
          >
            <List
              dataSource={aiSummary.softSkills}
              renderItem={skill => (
                <List.Item>
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <Text strong>{skill.skill}</Text>
                      <Tag color={getSkillColor(skill.level)}>{skill.assessment}</Tag>
                    </div>
                    <Progress
                      percent={skill.level}
                      strokeColor={getSkillColor(skill.level)}
                      size="small"
                    />
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Interview Performance Metrics */}
        <Col xs={24}>
          <Card
            title={
              <Space>
                <RocketOutlined style={{ color: '#13c2c2' }} />
                Interview Performance Metrics
              </Space>
            }
            style={{ borderRadius: '12px' }}
          >
            <Row gutter={[16, 16]}>
              {aiSummary.interviewPerformance.map((metric, index) => (
                <Col xs={24} sm={12} md={8} key={index}>
                  <Card size="small" style={{ backgroundColor: '#fafafa' }}>
                    <div style={{ textAlign: 'center' }}>
                      <Title level={5} style={{ margin: '0 0 8px 0' }}>{metric.metric}</Title>
                      <Progress
                        type="dashboard"
                        percent={metric.score}
                        width={80}
                        strokeColor={getSkillColor(metric.score)}
                      />
                      <Paragraph style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#8c8c8c' }}>
                        {metric.feedback}
                      </Paragraph>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        {/* Recommendations & Next Steps */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
                AI Recommendations
              </Space>
            }
            style={{ height: '100%', borderRadius: '12px' }}
          >
            <List
              dataSource={aiSummary.recommendations}
              renderItem={item => (
                <List.Item>
                  <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                  <Text>{item}</Text>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <RocketOutlined style={{ color: '#1890ff' }} />
                Suggested Next Steps
              </Space>
            }
            style={{ height: '100%', borderRadius: '12px' }}
          >
            <Timeline>
              {aiSummary.nextSteps.map((step, index) => (
                <Timeline.Item
                  key={index}
                  color={step.priority === 'high' ? 'red' : 'blue'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Text strong>{step.action}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>{step.timeline}</Text>
                    </div>
                    <Tag color={step.priority === 'high' ? 'red' : 'blue'}>
                      {step.priority.toUpperCase()}
                    </Tag>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AISummary;
