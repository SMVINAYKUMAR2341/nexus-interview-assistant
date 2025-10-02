import React, { useState, useEffect, useRef } from 'react';
import { Button, Avatar, Badge, Empty, Spin } from 'antd';
import { 
  SendOutlined, 
  ClockCircleOutlined, 
  CheckOutlined,
  UserOutlined,
  WechatOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../store/useInterviewStore';
import styles from './ChatWindow.module.css';

const ChatWindow = ({ currentUser, contacts = [], messages = [], onSendMessage, isTyping = false }) => {
  const [selectedContact, setSelectedContact] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Mock contacts data - replace with real data
  const mockContacts = contacts.length > 0 ? contacts : [
    {
      id: 1,
      name: 'John Doe',
      avatar: 'https://i.pravatar.cc/150?img=1',
      lastMessage: 'Hello, Are you there?',
      timestamp: 'Just now',
      unreadCount: 1,
      isOnline: true
    },
    {
      id: 2,
      name: 'Danny Smith',
      avatar: 'https://i.pravatar.cc/150?img=2',
      lastMessage: 'Thanks for the interview opportunity!',
      timestamp: '5 mins ago',
      unreadCount: 0,
      isOnline: true
    },
    {
      id: 3,
      name: 'Alex Steward',
      avatar: 'https://i.pravatar.cc/150?img=3',
      lastMessage: 'Can we reschedule?',
      timestamp: 'Yesterday',
      unreadCount: 0,
      isOnline: false
    },
    {
      id: 4,
      name: 'Ashley Olsen',
      avatar: 'https://i.pravatar.cc/150?img=4',
      lastMessage: 'I completed the technical test',
      timestamp: 'Yesterday',
      unreadCount: 0,
      isOnline: false
    },
    {
      id: 5,
      name: 'Kate Moss',
      avatar: 'https://i.pravatar.cc/150?img=5',
      lastMessage: 'When will I get the results?',
      timestamp: 'Yesterday',
      unreadCount: 0,
      isOnline: true
    },
    {
      id: 6,
      name: 'Lara Croft',
      avatar: 'https://i.pravatar.cc/150?img=6',
      lastMessage: 'Looking forward to hearing from you',
      timestamp: 'Yesterday',
      unreadCount: 0,
      isOnline: false
    },
    {
      id: 7,
      name: 'Brad Pitt',
      avatar: 'https://i.pravatar.cc/150?img=7',
      lastMessage: 'Thank you for your time today',
      timestamp: '5 mins ago',
      unreadCount: 0,
      isOnline: true
    }
  ];

  // Mock messages - replace with real messages filtered by selected contact
  const getMockMessages = (contactId) => {
    return [
      {
        id: 1,
        senderId: contactId,
        senderName: mockContacts.find(c => c.id === contactId)?.name,
        senderAvatar: mockContacts.find(c => c.id === contactId)?.avatar,
        message: 'Hi! Thank you for the interview opportunity. I wanted to follow up on the technical questions we discussed.',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        isOwn: false
      },
      {
        id: 2,
        senderId: currentUser?.id || 'me',
        senderName: currentUser?.name || 'You',
        senderAvatar: currentUser?.avatar || 'https://i.pravatar.cc/150?img=10',
        message: 'Hello! Thanks for reaching out. I\'d be happy to discuss the technical aspects further. What specific areas would you like to clarify?',
        timestamp: new Date(Date.now() - 3000000).toISOString(),
        isOwn: true
      },
      {
        id: 3,
        senderId: contactId,
        senderName: mockContacts.find(c => c.id === contactId)?.name,
        senderAvatar: mockContacts.find(c => c.id === contactId)?.avatar,
        message: 'I was particularly interested in the algorithm optimization question. Could you provide some additional context about the expected approach?',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        isOwn: false
      },
      {
        id: 4,
        senderId: currentUser?.id || 'me',
        senderName: currentUser?.name || 'You',
        senderAvatar: currentUser?.avatar || 'https://i.pravatar.cc/150?img=10',
        message: 'Absolutely! For the optimization question, we\'re looking for candidates to demonstrate understanding of time and space complexity. The ideal solution would involve discussing trade-offs between different approaches.',
        timestamp: new Date(Date.now() - 900000).toISOString(),
        isOwn: true
      }
    ];
  };

  const currentMessages = selectedContact ? getMockMessages(selectedContact.id) : [];

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedContact) return;

    setIsSending(true);
    
    try {
      // Call the onSendMessage callback if provided
      if (onSendMessage) {
        await onSendMessage({
          recipientId: selectedContact.id,
          message: messageText,
          timestamp: new Date().toISOString()
        });
      }

      // In a real implementation, this would send via socket.io
      console.log('Sending message:', {
        to: selectedContact.id,
        message: messageText
      });

      setMessageText('');
      textareaRef.current?.focus();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} mins ago`;
    if (hours < 24) return `${hours} hours ago`;
    if (days === 1) return 'Yesterday';
    return date.toLocaleDateString();
  };

  return (
    <div className={styles.gradientCustom}>
      <div className={styles.container}>
        <div className={styles.chatLayout}>
          {/* Member List Sidebar */}
          <div className={styles.memberSidebar}>
            <h5 className={styles.sidebarTitle}>
              {currentUser?.role === 'Interviewer' ? 'Candidates' : 'Recruiters'}
            </h5>
            
            <div className={styles.maskCustom}>
              <div className={styles.cardBody}>
                <ul className={styles.memberList}>
                  {mockContacts.map((contact) => (
                    <li
                      key={contact.id}
                      className={`${styles.memberItem} ${selectedContact?.id === contact.id ? styles.active : ''}`}
                      onClick={() => setSelectedContact(contact)}
                    >
                      <div className={styles.memberLink}>
                        <div className={styles.memberInfo}>
                          <Badge dot status={contact.isOnline ? 'success' : 'default'} offset={[-5, 50]}>
                            <Avatar
                              src={contact.avatar}
                              size={60}
                              icon={<UserOutlined />}
                              className={styles.memberAvatar}
                            />
                          </Badge>
                          <div className={styles.memberDetails}>
                            <p className={styles.memberName}>{contact.name}</p>
                            <p className={styles.lastMessage}>{contact.lastMessage}</p>
                          </div>
                        </div>
                        <div className={styles.memberMeta}>
                          <p className={styles.timeStamp}>{contact.timestamp}</p>
                          {contact.unreadCount > 0 && (
                            <span className={styles.unreadBadge}>{contact.unreadCount}</span>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className={styles.chatArea}>
            <div className={styles.chatContainer}>
              {selectedContact ? (
                <>
                  {/* Chat Header */}
                  <div className={styles.chatHeader}>
                    <div className={styles.chatHeaderContent}>
                      <Badge dot status={selectedContact.isOnline ? 'success' : 'default'} offset={[-5, 45]}>
                        <Avatar
                          src={selectedContact.avatar}
                          size={50}
                          icon={<UserOutlined />}
                          className={styles.chatHeaderAvatar}
                        />
                      </Badge>
                      <div className={styles.chatHeaderInfo}>
                        <h4 className={styles.chatHeaderName}>{selectedContact.name}</h4>
                        <div className={styles.chatHeaderStatus}>
                          <span className={`${styles.onlineStatus} ${!selectedContact.isOnline ? styles.offline : ''}`}>
                            <span className={styles.statusDot}></span>
                            {selectedContact.isOnline ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Messages List */}
                  <div className={styles.messagesList}>
                    {currentMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`${styles.messageItem} ${msg.isOwn ? styles.own : ''}`}
                      >
                        <Avatar
                          src={msg.senderAvatar}
                          size={50}
                          icon={<UserOutlined />}
                          className={styles.messageAvatar}
                        />
                        <div className={styles.messageContent}>
                          <div className={styles.messageCard}>
                            <div className={styles.messageHeader}>
                              <p className={styles.messageSender}>{msg.senderName}</p>
                              <p className={styles.messageTime}>
                                <ClockCircleOutlined style={{ fontSize: '12px' }} />
                                {formatTime(msg.timestamp)}
                              </p>
                            </div>
                            <div className={styles.messageBody}>
                              <p className={styles.messageText}>{msg.message}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Typing Indicator */}
                    {isTyping && (
                      <div className={styles.messageItem}>
                        <Avatar
                          src={selectedContact.avatar}
                          size={50}
                          icon={<UserOutlined />}
                          className={styles.messageAvatar}
                        />
                        <div className={styles.typingIndicator}>
                          <div className={styles.typingDot}></div>
                          <div className={styles.typingDot}></div>
                          <div className={styles.typingDot}></div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className={styles.messageInputArea}>
                    <div className={styles.inputWrapper}>
                      <div className={styles.textareaWrapper}>
                        <textarea
                          ref={textareaRef}
                          className={styles.messageTextarea}
                          rows={3}
                          placeholder="Type your message here..."
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          onKeyPress={handleKeyPress}
                          disabled={isSending}
                        />
                      </div>
                      <button
                        className={styles.sendButton}
                        onClick={handleSendMessage}
                        disabled={!messageText.trim() || isSending}
                      >
                        {isSending ? (
                          <Spin size="small" />
                        ) : (
                          <>
                            <SendOutlined />
                            Send
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className={styles.emptyState}>
                  <WechatOutlined className={styles.emptyIcon} />
                  <p className={styles.emptyText}>Select a conversation to start messaging</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
