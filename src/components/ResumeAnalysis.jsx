import React, { useState, useEffect } from 'react';
import { Card, Progress, Row, Col, Tag, Divider, List, Typography, Spin, Empty, Button, message } from 'antd';
import {
  FileTextOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  StarOutlined,
  ThunderboltOutlined,
  RocketOutlined,
  BulbOutlined,
  DownloadOutlined,
  EyeOutlined,
  LineChartOutlined
} from '@ant-design/icons';
import { calculateATSScoreWithAI } from '../lib/aiService';
import '../styles/ResumeAnalysisNeon.css';

const { Title, Text, Paragraph } = Typography;

const ResumeAnalysis = ({ candidate }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiATSData, setAiATSData] = useState(null);

  // Calculate ATS Score using DeepSeek AI when candidate changes
  useEffect(() => {
    const calculateATS = async () => {
      if (!candidate || !candidate.resumeText) return;
      
      setIsAnalyzing(true);
      try {
        const result = await calculateATSScoreWithAI(candidate.resumeText);
        if (result.success) {
          setAiATSData(result);
          message.success('ATS Score calculated using AI');
        }
      } catch (error) {
        console.error('Error calculating ATS:', error);
      } finally {
        setIsAnalyzing(false);
      }
    };

    calculateATS();
  }, [candidate?.id]);

  if (!candidate) {
    return (
      <div className="neon-empty-resume">
        <FileTextOutlined className="neon-empty-icon" />
        <h3>No Resume Data Available</h3>
        <p>Select a candidate to view their resume analysis</p>
      </div>
    );
  }

  // Use AI data if available, otherwise fallback to mock data
  const atsScore = aiATSData?.atsScore || candidate.atsScore || Math.floor(Math.random() * 20) + 75;
  const atsBreakdown = aiATSData?.breakdown || {
    formatting: Math.floor(Math.random() * 10) + 85,
    keywords: Math.floor(Math.random() * 15) + 80,
    experience: Math.floor(Math.random() * 15) + 75,
    education: Math.floor(Math.random() * 20) + 70,
    skills: Math.floor(Math.random() * 15) + 80,
  };

  // Mock AI Resume Analysis Data (in production, this would come from AI service)
  const resumeAnalysis = {
    atsScore: atsScore,
    examScore: candidate.finalScore || Math.floor(Math.random() * 20) + 70, // 70-90
    
    atsBreakdown: atsBreakdown,

    aiEvaluation: {
      overallRating: atsScore / 20, // Convert 0-100 to 0-5 rating
      recommendation: candidate.finalScore >= 85 ? 'Strong Hire' : candidate.finalScore >= 70 ? 'Hire' : candidate.finalScore >= 60 ? 'Maybe' : 'No Hire',
      summary: aiATSData?.summary || `${candidate.name}'s resume demonstrates ${candidate.finalScore >= 80 ? 'excellent' : 'strong'} qualifications for the Full Stack Developer position. The candidate has comprehensive experience with modern web technologies, strong educational background, and relevant project experience. Their technical skill set aligns well with our requirements, particularly in React, Node.js, and MongoDB.`,
      
      strengths: aiATSData?.strengths || [
        'Strong technical skill set matching job requirements',
        'Relevant work experience in full-stack development',
        'Well-structured and professional resume format',
        'Clear demonstration of project impact and achievements',
        'Continuous learning and skill development evident'
      ],
      
      concerns: aiATSData?.weaknesses || [
        'Could benefit from more system design experience',
        'Limited cloud infrastructure exposure',
        'Certification in key technologies would strengthen profile'
      ],

      skillsMatched: [
        { skill: 'JavaScript/React', match: 95, required: true },
        { skill: 'Node.js/Express', match: 90, required: true },
        { skill: 'MongoDB/Database', match: 85, required: true },
        { skill: 'REST APIs', match: 90, required: true },
        { skill: 'Git/Version Control', match: 85, required: false },
        { skill: 'Cloud Services (AWS/Azure)', match: 65, required: false },
        { skill: 'Docker/Containerization', match: 70, required: false },
        { skill: 'Testing (Jest/Cypress)', match: 75, required: false },
      ],

      experienceAnalysis: {
        totalYears: candidate.experience || '2-3 years',
        relevantYears: '2 years',
        careerProgression: 'Positive',
        projectComplexity: 'Medium to High',
        leadership: candidate.finalScore >= 80 ? 'Demonstrated' : 'Limited'
      },

      redFlags: [],
      
      fitScore: {
        // Calculate technical fit based on ATS score and interview performance
        technical: Math.round((atsScore * 0.6) + ((candidate.finalScore || 70) * 0.4)),
        // Cultural fit based on communication and interview performance
        cultural: Math.round(((candidate.finalScore || 70) * 0.7) + (atsScore * 0.3)),
        // Growth potential based on overall performance and ATS
        growth: Math.round(((candidate.finalScore || 70) * 0.5) + (atsScore * 0.5)),
        // Overall fit is weighted average of all factors
        overall: Math.round((atsScore * 0.4) + ((candidate.finalScore || 70) * 0.6))
      }
    },

    comparisonData: {
      candidateScore: candidate.finalScore || 85,
      averageScore: 72,
      topPerformer: 92,
      percentile: Math.floor(((candidate.finalScore || 85) / 100) * 100)
    },

    keywords: {
      matched: ['React', 'Node.js', 'JavaScript', 'MongoDB', 'REST API', 'Git', 'Agile', 'Express', 'HTML/CSS', 'TypeScript'],
      missing: ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Microservices'],
      bonus: ['Redux', 'GraphQL', 'Next.js', 'Testing']
    }
  };

  const getScoreColor = (score) => {
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'average';
    return 'poor';
  };

  const getRecommendationColor = (rec) => {
    if (rec === 'Strong Hire') return '#4ade80';
    if (rec === 'Hire') return '#58a6ff';
    if (rec === 'Maybe') return '#fbbf24';
    return '#f87171';
  };

  return (
    <div className="resume-analysis-container">
      {/* Header Section */}
      <div className="neon-resume-header">
        <div className="neon-resume-title">
          <FileTextOutlined className="neon-header-icon" />
          <div>
            <h2>Resume & AI Analysis</h2>
            <p>Comprehensive ATS scoring and AI-powered evaluation</p>
          </div>
        </div>
        <div className="neon-resume-actions">
          <Button 
            icon={<EyeOutlined />} 
            className="neon-action-btn secondary"
            onClick={() => window.open(candidate.resumeUrl, '_blank')}
          >
            View Resume
          </Button>
          <Button 
            icon={<DownloadOutlined />} 
            className="neon-action-btn primary"
          >
            Download PDF
          </Button>
        </div>
      </div>

      {/* Score Overview Cards */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col xs={24} md={12} lg={8}>
          <div className="neon-score-card ats">
            <div className="score-icon">
              <FileTextOutlined />
            </div>
            <div className="score-content">
              <div className="score-label">ATS Score</div>
              <div className="score-value">{resumeAnalysis.atsScore}<small>/100</small></div>
              <Progress 
                percent={resumeAnalysis.atsScore} 
                strokeColor={{
                  '0%': '#58a6ff',
                  '100%': '#7c3aed',
                }}
                showInfo={false}
                strokeWidth={8}
              />
              <div className="score-note">Resume Parser Compatible</div>
            </div>
          </div>
        </Col>

        <Col xs={24} md={12} lg={8}>
          <div className="neon-score-card exam">
            <div className="score-icon">
              <TrophyOutlined />
            </div>
            <div className="score-content">
              <div className="score-label">Interview Score</div>
              <div className="score-value">{resumeAnalysis.examScore}<small>/100</small></div>
              <Progress 
                percent={resumeAnalysis.examScore} 
                strokeColor={{
                  '0%': '#4ade80',
                  '100%': '#22c55e',
                }}
                showInfo={false}
                strokeWidth={8}
              />
              <div className="score-note">Technical Performance</div>
            </div>
          </div>
        </Col>

        <Col xs={24} md={12} lg={8}>
          <div className="neon-score-card combined">
            <div className="score-icon">
              <RocketOutlined />
            </div>
            <div className="score-content">
              <div className="score-label">Overall Rating</div>
              <div className="score-value">
                {Math.round((resumeAnalysis.atsScore + resumeAnalysis.examScore) / 2)}
                <small>/100</small>
              </div>
              <Progress 
                percent={Math.round((resumeAnalysis.atsScore + resumeAnalysis.examScore) / 2)} 
                strokeColor={{
                  '0%': '#ff6bed',
                  '100%': '#ec4899',
                }}
                showInfo={false}
                strokeWidth={8}
              />
              <div className="score-note">Combined Assessment</div>
            </div>
          </div>
        </Col>
      </Row>

      {/* Comparison Chart */}
      <div className="neon-chart-card">
        <div className="chart-header">
          <LineChartOutlined style={{ fontSize: '24px', color: '#58a6ff' }} />
          <h3>Performance Comparison</h3>
        </div>
        <div className="comparison-chart">
          <div className="chart-bars">
            <div className="chart-bar-group">
              <div className="bar-label">This Candidate</div>
              <div className="bar-container">
                <div 
                  className="bar candidate-bar" 
                  style={{ width: `${resumeAnalysis.comparisonData.candidateScore}%` }}
                >
                  <span className="bar-value">{resumeAnalysis.comparisonData.candidateScore}</span>
                </div>
              </div>
            </div>

            <div className="chart-bar-group">
              <div className="bar-label">Average Candidate</div>
              <div className="bar-container">
                <div 
                  className="bar average-bar" 
                  style={{ width: `${resumeAnalysis.comparisonData.averageScore}%` }}
                >
                  <span className="bar-value">{resumeAnalysis.comparisonData.averageScore}</span>
                </div>
              </div>
            </div>

            <div className="chart-bar-group">
              <div className="bar-label">Top Performer</div>
              <div className="bar-container">
                <div 
                  className="bar top-bar" 
                  style={{ width: `${resumeAnalysis.comparisonData.topPerformer}%` }}
                >
                  <span className="bar-value">{resumeAnalysis.comparisonData.topPerformer}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="percentile-badge">
            <ThunderboltOutlined />
            <div>
              <div className="percentile-value">{resumeAnalysis.comparisonData.percentile}th</div>
              <div className="percentile-label">Percentile</div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Evaluation Section */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <div className="neon-evaluation-card">
            <div className="evaluation-header">
              <BulbOutlined style={{ fontSize: '24px', color: '#fbbf24' }} />
              <div>
                <h3>AI Recommendation</h3>
                <div className="recommendation-badge" style={{ background: getRecommendationColor(resumeAnalysis.aiEvaluation.recommendation) }}>
                  {resumeAnalysis.aiEvaluation.recommendation}
                </div>
              </div>
            </div>

            <div className="rating-display">
              <StarOutlined style={{ color: '#fbbf24', fontSize: '20px' }} />
              <span className="rating-value">{resumeAnalysis.aiEvaluation.overallRating}</span>
              <span className="rating-total">/5.0</span>
            </div>

            <Paragraph className="evaluation-summary">
              {resumeAnalysis.aiEvaluation.summary}
            </Paragraph>

            <Divider style={{ borderColor: 'rgba(88, 166, 255, 0.2)' }} />

            <div className="evaluation-section">
              <h4><CheckCircleOutlined style={{ color: '#4ade80' }} /> Key Strengths</h4>
              <List
                dataSource={resumeAnalysis.aiEvaluation.strengths}
                renderItem={(item) => (
                  <List.Item className="strength-item">
                    <Text>✓ {item}</Text>
                  </List.Item>
                )}
              />
            </div>

            {resumeAnalysis.aiEvaluation.concerns.length > 0 && (
              <>
                <Divider style={{ borderColor: 'rgba(88, 166, 255, 0.2)' }} />
                <div className="evaluation-section">
                  <h4><CloseCircleOutlined style={{ color: '#fbbf24' }} /> Areas for Consideration</h4>
                  <List
                    dataSource={resumeAnalysis.aiEvaluation.concerns}
                    renderItem={(item) => (
                      <List.Item className="concern-item">
                        <Text>⚠ {item}</Text>
                      </List.Item>
                    )}
                  />
                </div>
              </>
            )}
          </div>
        </Col>

        <Col xs={24} lg={12}>
          {/* ATS Breakdown */}
          <div className="neon-ats-breakdown">
            <h3>ATS Score Breakdown</h3>
            <div className="ats-metrics">
              {Object.entries(resumeAnalysis.atsBreakdown).map(([key, value]) => (
                <div key={key} className="ats-metric">
                  <div className="metric-header">
                    <span className="metric-name">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </span>
                    <span className="metric-value">{value}%</span>
                  </div>
                  <Progress 
                    percent={value} 
                    strokeColor={{
                      '0%': '#58a6ff',
                      '100%': '#7c3aed',
                    }}
                    showInfo={false}
                    strokeWidth={6}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Skills Match */}
          <div className="neon-skills-match" style={{ marginTop: '24px' }}>
            <h3>Skills Match Analysis</h3>
            <div className="skills-list">
              {resumeAnalysis.aiEvaluation.skillsMatched.map((item, idx) => (
                <div key={idx} className="skill-match-item">
                  <div className="skill-info">
                    <span className="skill-name">
                      {item.skill}
                      {item.required && <Tag color="red" style={{ marginLeft: '8px', fontSize: '10px' }}>Required</Tag>}
                    </span>
                    <span className={`skill-match ${item.match >= 80 ? 'high' : item.match >= 60 ? 'medium' : 'low'}`}>
                      {item.match}% Match
                    </span>
                  </div>
                  <Progress 
                    percent={item.match} 
                    strokeColor={item.match >= 80 ? '#4ade80' : item.match >= 60 ? '#fbbf24' : '#f87171'}
                    showInfo={false}
                    strokeWidth={4}
                  />
                </div>
              ))}
            </div>
          </div>
        </Col>
      </Row>

      {/* Keywords Section */}
      <div className="neon-keywords-card">
        <h3>Resume Keywords Analysis</h3>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <div className="keyword-section matched">
              <div className="keyword-header">
                <CheckCircleOutlined /> Matched Keywords ({resumeAnalysis.keywords.matched.length})
              </div>
              <div className="keyword-tags">
                {resumeAnalysis.keywords.matched.map((keyword, idx) => (
                  <Tag key={idx} color="green" className="neon-tag">{keyword}</Tag>
                ))}
              </div>
            </div>
          </Col>

          <Col xs={24} md={8}>
            <div className="keyword-section missing">
              <div className="keyword-header">
                <CloseCircleOutlined /> Missing Keywords ({resumeAnalysis.keywords.missing.length})
              </div>
              <div className="keyword-tags">
                {resumeAnalysis.keywords.missing.map((keyword, idx) => (
                  <Tag key={idx} color="red" className="neon-tag">{keyword}</Tag>
                ))}
              </div>
            </div>
          </Col>

          <Col xs={24} md={8}>
            <div className="keyword-section bonus">
              <div className="keyword-header">
                <StarOutlined /> Bonus Keywords ({resumeAnalysis.keywords.bonus.length})
              </div>
              <div className="keyword-tags">
                {resumeAnalysis.keywords.bonus.map((keyword, idx) => (
                  <Tag key={idx} color="gold" className="neon-tag">{keyword}</Tag>
                ))}
              </div>
            </div>
          </Col>
        </Row>
      </div>

      {/* Fit Score */}
      <div className="neon-fit-score">
        <h3>Organization Fit Analysis</h3>
        <Row gutter={[24, 24]}>
          <Col xs={12} sm={6}>
            <div className="fit-metric">
              <Progress 
                type="circle" 
                percent={resumeAnalysis.aiEvaluation.fitScore.technical} 
                strokeColor={{
                  '0%': '#58a6ff',
                  '100%': '#7c3aed',
                }}
                strokeWidth={8}
                trailColor="rgba(88, 166, 255, 0.1)"
                width={120}
                format={(percent) => <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{percent}%</span>}
              />
              <div className="fit-label">Technical Fit</div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div className="fit-metric">
              <Progress 
                type="circle" 
                percent={resumeAnalysis.aiEvaluation.fitScore.cultural} 
                strokeColor={{
                  '0%': '#10b981',
                  '100%': '#22c55e',
                }}
                strokeWidth={8}
                trailColor="rgba(16, 185, 129, 0.1)"
                width={120}
                format={(percent) => <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{percent}%</span>}
              />
              <div className="fit-label">Cultural Fit</div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div className="fit-metric">
              <Progress 
                type="circle" 
                percent={resumeAnalysis.aiEvaluation.fitScore.growth} 
                strokeColor={{
                  '0%': '#f59e0b',
                  '100%': '#fbbf24',
                }}
                strokeWidth={8}
                trailColor="rgba(245, 158, 11, 0.1)"
                width={120}
                format={(percent) => <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{percent}%</span>}
              />
              <div className="fit-label">Growth Potential</div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div className="fit-metric">
              <Progress 
                type="circle" 
                percent={resumeAnalysis.aiEvaluation.fitScore.overall} 
                strokeColor={{
                  '0%': '#ec4899',
                  '100%': '#ff6bed',
                }}
                strokeWidth={8}
                trailColor="rgba(236, 72, 153, 0.1)"
                width={120}
                format={(percent) => <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{percent}%</span>}
              />
              <div className="fit-label">Overall Fit</div>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default ResumeAnalysis;
