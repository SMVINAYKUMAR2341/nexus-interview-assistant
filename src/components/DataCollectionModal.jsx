import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Steps, message, Space, Progress } from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  RobotOutlined
} from '@ant-design/icons';
import { checkMissingFields, validateEmail, validatePhone, validateName } from '../lib/resumeParser';
import styles from './DataCollectionModal.module.css';

const { Step } = Steps;

const DataCollectionModal = ({ visible, candidateData, onComplete, onCancel }) => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [missingFields, setMissingFields] = useState([]);
  const [collectedData, setCollectedData] = useState({});
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (visible && candidateData) {
      const missing = checkMissingFields(candidateData);
      setMissingFields(missing);
      
      // Pre-fill form with existing data
      form.setFieldsValue({
        name: candidateData.name || '',
        email: candidateData.email || '',
        phone: candidateData.phone || ''
      });

      if (missing.length === 0) {
        // All data present, proceed directly
        message.success('All required information found!');
        setTimeout(() => onComplete(candidateData), 500);
      }
    }
  }, [visible, candidateData]);

  const handleSubmit = async () => {
    try {
      setIsValidating(true);
      const values = await form.validateFields();
      
      const completeData = {
        ...candidateData,
        ...values,
        dataCollectedAt: new Date().toISOString()
      };

      message.success('Information collected successfully!');
      onComplete(completeData);
    } catch (error) {
      console.error('Validation failed:', error);
      message.error('Please fill in all required fields correctly');
    } finally {
      setIsValidating(false);
    }
  };

  const getStepIcon = (field) => {
    switch (field) {
      case 'name': return <UserOutlined />;
      case 'email': return <MailOutlined />;
      case 'phone': return <PhoneOutlined />;
      default: return <CheckCircleOutlined />;
    }
  };

  return (
    <Modal
      open={visible}
      title={null}
      footer={null}
      onCancel={onCancel}
      width={600}
      className={styles.modal}
      centered
      closable={false}
    >
      <div className={styles.modalContent}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <RobotOutlined />
          </div>
          <h2 className={styles.title}>Complete Your Profile</h2>
          <p className={styles.subtitle}>
            {missingFields.length > 0 
              ? `We need ${missingFields.length} more piece${missingFields.length > 1 ? 's' : ''} of information to start your interview`
              : 'Verifying your information...'}
          </p>
        </div>

        {/* Progress Steps */}
        {missingFields.length > 0 && (
          <div className={styles.stepsContainer}>
            <Steps current={currentStep} size="small">
              {missingFields.map((field, index) => (
                <Step
                  key={field}
                  title={field.charAt(0).toUpperCase() + field.slice(1)}
                  icon={getStepIcon(field)}
                />
              ))}
              <Step title="Ready" icon={<CheckCircleOutlined />} />
            </Steps>
          </div>
        )}

        {/* Form */}
        <Form
          form={form}
          layout="vertical"
          className={styles.form}
          onFinish={handleSubmit}
        >
          {/* Name Field */}
          {missingFields.includes('name') && (
            <Form.Item
              name="name"
              label="Full Name"
              rules={[
                { required: true, message: 'Please enter your full name' },
                { 
                  validator: (_, value) => {
                    if (!value || validateName(value)) {
                      return Promise.resolve();
                    }
                    return Promise.reject('Please enter a valid name');
                  }
                }
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="John Doe"
                size="large"
                autoFocus
              />
            </Form.Item>
          )}

          {/* Email Field */}
          {missingFields.includes('email') && (
            <Form.Item
              name="email"
              label="Email Address"
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email' },
                {
                  validator: (_, value) => {
                    if (!value || validateEmail(value)) {
                      return Promise.resolve();
                    }
                    return Promise.reject('Please enter a valid email address');
                  }
                }
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="john.doe@example.com"
                size="large"
              />
            </Form.Item>
          )}

          {/* Phone Field */}
          {missingFields.includes('phone') && (
            <Form.Item
              name="phone"
              label="Phone Number"
              rules={[
                { required: true, message: 'Please enter your phone number' },
                {
                  validator: (_, value) => {
                    if (!value || validatePhone(value)) {
                      return Promise.resolve();
                    }
                    return Promise.reject('Please enter a valid phone number');
                  }
                }
              ]}
            >
              <Input
                prefix={<PhoneOutlined />}
                placeholder="(123) 456-7890"
                size="large"
              />
            </Form.Item>
          )}

          {/* Submit Button */}
          <Form.Item className={styles.buttonGroup}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={isValidating}
                block
                icon={<CheckCircleOutlined />}
                className={styles.submitButton}
              >
                {missingFields.length > 0 ? 'Continue to Interview' : 'Start Interview'}
              </Button>
              <Button
                onClick={onCancel}
                size="large"
                block
                className={styles.cancelButton}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>

        {/* Info Box */}
        <div className={styles.infoBox}>
          <ClockCircleOutlined className={styles.infoIcon} />
          <p className={styles.infoText}>
            This information is required to personalize your interview experience and contact you with results.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default DataCollectionModal;
