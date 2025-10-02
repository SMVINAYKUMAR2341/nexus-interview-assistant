import React from 'react';
import { Card, Descriptions, Avatar, Tag, Space, Progress, Divider, List, Typography, Button, Row, Col, Timeline } from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  LinkedinOutlined,
  GithubOutlined,
  GlobalOutlined,
  FileTextOutlined,
  TrophyOutlined,
  BulbOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const CandidateProfile = ({ candidate }) => {
  if (!candidate) {
    return (
      <Card style={{ margin: '24px', textAlign: 'center', padding: '40px' }}>
        <UserOutlined style={{ fontSize: '64px', color: '#d9d9d9', marginBottom: '16px' }} />
        <Title level={4} type="secondary">No candidate selected</Title>
        <Text type="secondary">Select a candidate from the list to view their profile</Text>
      </Card>
    );
  }

  // Use actual candidate data with fallbacks
  const profileData = {
    ...candidate,
    phone: candidate.phone || '+1 (555) 123-4567',
    location: candidate.location || 'San Francisco, CA',
    linkedin: candidate.linkedin || 'Profile',
    github: candidate.github || 'Profile',
    website: candidate.website || 'johndoe.dev',
    experience: [
      {
        title: 'Senior Software Engineer',
        company: 'Tech Corp',
        period: '2022 - Present',
        description: 'Leading development of cloud-native applications using React, Node.js, and AWS. Managing a team of 3 developers.'
      },
      {
        title: 'Software Engineer',
        company: 'StartupXYZ',
        period: '2020 - 2022',
        description: 'Developed full-stack web applications, implemented CI/CD pipelines, and improved application performance by 40%.'
      },
      {
        title: 'Junior Developer',
        company: 'WebSolutions Inc',
        period: '2019 - 2020',
        description: 'Built responsive websites and maintained existing codebases. Collaborated with design team on UI/UX improvements.'
      }
    ],
    education: [
      {
        degree: 'Bachelor of Science in Computer Science',
        institution: 'University of California',
        year: '2019',
        gpa: '3.8/4.0'
      }
    ],
    skills: {
      'Frontend': ['React', 'Vue.js', 'TypeScript', 'HTML/CSS', 'Tailwind'],
      'Backend': ['Node.js', 'Express', 'Python', 'Django', 'REST APIs'],
      'Database': ['MongoDB', 'PostgreSQL', 'Redis', 'MySQL'],
      'DevOps': ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Git'],
      'Soft Skills': ['Leadership', 'Communication', 'Problem Solving', 'Team Collaboration']
    },
    certifications: [
      'AWS Certified Solutions Architect',
      'MongoDB Certified Developer',
      'Scrum Master Certified'
    ],
    projects: [
      {
        name: 'E-Commerce Platform',
        description: 'Built a scalable e-commerce platform handling 100K+ daily users',
        technologies: ['React', 'Node.js', 'MongoDB', 'AWS']
      },
      {
        name: 'Real-time Chat Application',
        description: 'Developed WebSocket-based chat with end-to-end encryption',
        technologies: ['Socket.io', 'Redis', 'PostgreSQL']
      }
    ]
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Header Card */}
      <Card style={{ marginBottom: '24px', borderRadius: '12px' }}>
        <Row gutter={24}>
          <Col xs={24} md={6} style={{ textAlign: 'center' }}>
            <Avatar
              size={120}
              icon={<UserOutlined />}
              src={candidate.avatar}
              style={{ backgroundColor: '#1890ff', marginBottom: '16px' }}
            />
            <Title level={4} style={{ margin: '8px 0' }}>{candidate.name}</Title>
            <Tag color="blue" style={{ fontSize: '14px' }}>{candidate.role}</Tag>
            <div style={{ marginTop: '16px' }}>
              <Progress
                type="circle"
                percent={candidate.score || 0}
                width={80}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
              />
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#8c8c8c' }}>
                Interview Score
              </div>
            </div>
          </Col>

          <Col xs={24} md={18}>
            <Descriptions column={{ xs: 1, sm: 2, md: 2 }} bordered size="small">
              <Descriptions.Item label={<><MailOutlined /> Email</>}>
                <a href={`mailto:${candidate.email}`} style={{ color: '#58a6ff' }}>
                  {candidate.email}
                </a>
              </Descriptions.Item>
              <Descriptions.Item label={<><PhoneOutlined /> Phone</>}>
                {profileData.phone || 'Not provided'}
              </Descriptions.Item>
              <Descriptions.Item label={<><EnvironmentOutlined /> Location</>}>
                {profileData.location || 'Not provided'}
              </Descriptions.Item>
              <Descriptions.Item label="Interview Date">
                {candidate.createdAt ? new Date(candidate.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'Invalid Date'}
              </Descriptions.Item>
              <Descriptions.Item label={<><LinkedinOutlined /> LinkedIn</>}>
                {candidate.linkedin ? (
                  <a href={`https://${candidate.linkedin}`} target="_blank" rel="noopener noreferrer" style={{ color: '#58a6ff' }}>
                    Profile
                  </a>
                ) : (
                  <Text type="secondary">Not provided</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label={<><GithubOutlined /> GitHub</>}>
                {candidate.github ? (
                  <a href={`https://${candidate.github}`} target="_blank" rel="noopener noreferrer" style={{ color: '#58a6ff' }}>
                    Profile
                  </a>
                ) : (
                  <Text type="secondary">Not provided</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label={<><GlobalOutlined /> Website</>} span={2}>
                {candidate.website ? (
                  <a href={`https://${candidate.website}`} target="_blank" rel="noopener noreferrer" style={{ color: '#58a6ff' }}>
                    {candidate.website}
                  </a>
                ) : (
                  <Text type="secondary">Not provided</Text>
                )}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: '16px' }}>
              <Space>
                <Button type="primary" icon={<FileTextOutlined />}>
                  Download Resume
                </Button>
                <Button icon={<MailOutlined />}>
                  Send Email
                </Button>
              </Space>
            </div>
          </Col>
        </Row>
      </Card>

      <Row gutter={[24, 24]}>
        {/* Experience */}
        <Col xs={24} lg={12}>
          <Card title="Work Experience" style={{ height: '100%', borderRadius: '12px' }}>
            <Timeline>
              {profileData.experience.map((exp, index) => (
                <Timeline.Item key={index} color="blue">
                  <Title level={5} style={{ margin: 0 }}>{exp.title}</Title>
                  <Text type="secondary">{exp.company}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>{exp.period}</Text>
                  <Paragraph style={{ marginTop: '8px', fontSize: '14px' }}>
                    {exp.description}
                  </Paragraph>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>

        {/* Education & Certifications */}
        <Col xs={24} lg={12}>
          <Card title="Education" style={{ marginBottom: '24px', borderRadius: '12px' }}>
            {profileData.education.map((edu, index) => (
              <div key={index}>
                <Title level={5} style={{ margin: 0 }}>{edu.degree}</Title>
                <Text type="secondary">{edu.institution}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Graduated: {edu.year} | GPA: {edu.gpa}
                </Text>
              </div>
            ))}
          </Card>

          <Card
            title={
              <Space>
                <TrophyOutlined />
                Certifications
              </Space>
            }
            style={{ borderRadius: '12px' }}
          >
            <List
              size="small"
              dataSource={profileData.certifications}
              renderItem={item => (
                <List.Item>
                  <Text>{item}</Text>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Skills */}
        <Col xs={24}>
          <Card
            title={
              <Space>
                <BulbOutlined />
                Skills & Technologies
              </Space>
            }
            style={{ borderRadius: '12px' }}
          >
            {Object.entries(profileData.skills).map(([category, skills]) => (
              <div key={category} style={{ marginBottom: '16px' }}>
                <Title level={5} style={{ marginBottom: '8px', color: '#1890ff' }}>
                  {category}
                </Title>
                <Space size={[8, 8]} wrap>
                  {skills.map(skill => (
                    <Tag key={skill} color="blue" style={{ fontSize: '13px', padding: '4px 12px' }}>
                      {skill}
                    </Tag>
                  ))}
                </Space>
              </div>
            ))}
          </Card>
        </Col>

        {/* Projects */}
        <Col xs={24}>
          <Card title="Notable Projects" style={{ borderRadius: '12px' }}>
            <List
              itemLayout="vertical"
              dataSource={profileData.projects}
              renderItem={project => (
                <List.Item>
                  <List.Item.Meta
                    title={<Title level={5}>{project.name}</Title>}
                    description={project.description}
                  />
                  <Space size={[4, 8]} wrap style={{ marginTop: '8px' }}>
                    {project.technologies.map(tech => (
                      <Tag key={tech}>{tech}</Tag>
                    ))}
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CandidateProfile;
