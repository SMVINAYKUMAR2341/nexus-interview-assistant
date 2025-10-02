import React, { useState, useEffect, useRef } from 'react';
import { message as antdMessage, Modal, Spin } from 'antd';
import { 
  SearchOutlined,
  PaperClipOutlined,
  SmileOutlined,
  SendOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
  FileOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileImageOutlined,
  FileZipOutlined,
  ClockCircleOutlined,
  WechatOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../store/useAuthStore';
import styles from './ChatWindowEnhanced.module.css';

const ChatWindowEnhanced = ({ currentUser, contacts = [], messages = [], onSendMessage, onFileUpload }) => {
  const [selectedContact, setSelectedContact] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textInputRef = useRef(null);

  // Emoji list
  const emojis = ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '😶‍🌫️', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐', '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '🩸'];

  // Mock contacts data
  const mockContacts = contacts.length > 0 ? contacts : [
    {
      id: 1,
      name: 'Marie Horwitz',
      avatar: 'https://i.pravatar.cc/150?img=1',
      lastMessage: 'Hello, Are you there?',
      timestamp: 'Just now',
      unreadCount: 3,
      status: 'online'
    },
    {
      id: 2,
      name: 'Alexa Chung',
      avatar: 'https://i.pravatar.cc/150?img=2',
      lastMessage: 'Thanks for your help!',
      timestamp: '5 mins ago',
      unreadCount: 2,
      status: 'away'
    },
    {
      id: 3,
      name: 'Danny McChain',
      avatar: 'https://i.pravatar.cc/150?img=3',
      lastMessage: 'See you tomorrow',
      timestamp: 'Yesterday',
      unreadCount: 0,
      status: 'online'
    },
    {
      id: 4,
      name: 'Ashley Olsen',
      avatar: 'https://i.pravatar.cc/150?img=4',
      lastMessage: 'Perfect, thank you!',
      timestamp: 'Yesterday',
      unreadCount: 0,
      status: 'offline'
    },
    {
      id: 5,
      name: 'Kate Moss',
      avatar: 'https://i.pravatar.cc/150?img=5',
      lastMessage: 'Looking forward to it',
      timestamp: 'Yesterday',
      unreadCount: 0,
      status: 'away'
    },
    {
      id: 6,
      name: 'Ben Smith',
      avatar: 'https://i.pravatar.cc/150?img=6',
      lastMessage: 'Great work today!',
      timestamp: 'Yesterday',
      unreadCount: 0,
      status: 'online'
    }
  ];

  // Mock messages
  const getMockMessages = (contactId) => {
    return [
      {
        id: 1,
        senderId: contactId,
        senderName: mockContacts.find(c => c.id === contactId)?.name,
        senderAvatar: mockContacts.find(c => c.id === contactId)?.avatar,
        message: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        type: 'text',
        isOwn: false
      },
      {
        id: 2,
        senderId: currentUser?.id || 'me',
        senderName: currentUser?.name || 'You',
        senderAvatar: currentUser?.avatar || 'https://i.pravatar.cc/150?img=10',
        message: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
        timestamp: new Date(Date.now() - 3000000).toISOString(),
        type: 'text',
        isOwn: true
      },
      {
        id: 3,
        senderId: contactId,
        senderName: mockContacts.find(c => c.id === contactId)?.name,
        senderAvatar: mockContacts.find(c => c.id === contactId)?.avatar,
        message: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        type: 'text',
        isOwn: false
      },
      {
        id: 4,
        senderId: currentUser?.id || 'me',
        senderName: currentUser?.name || 'You',
        senderAvatar: currentUser?.avatar || 'https://i.pravatar.cc/150?img=10',
        message: 'Here is my resume for your review.',
        timestamp: new Date(Date.now() - 1200000).toISOString(),
        type: 'file',
        isOwn: true,
        file: {
          name: 'Resume_JohnDoe.pdf',
          size: '245 KB',
          type: 'application/pdf',
          url: '#'
        }
      },
      {
        id: 5,
        senderId: contactId,
        senderName: mockContacts.find(c => c.id === contactId)?.name,
        senderAvatar: mockContacts.find(c => c.id === contactId)?.avatar,
        message: 'Thank you! I will review it shortly.',
        timestamp: new Date(Date.now() - 900000).toISOString(),
        type: 'text',
        isOwn: false
      }
    ];
  };

  const currentMessages = selectedContact ? getMockMessages(selectedContact.id) : [];

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Filter contacts by search
  const filteredContacts = mockContacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      antdMessage.error('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);

    // If it's an image, create preview
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove selected file
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle send message
  const handleSendMessage = async () => {
    if ((!messageText.trim() && !selectedFile) || !selectedContact) return;

    setIsSending(true);

    try {
      const messageData = {
        recipientId: selectedContact.id,
        message: messageText,
        timestamp: new Date().toISOString(),
        file: selectedFile ? {
          name: selectedFile.name,
          size: formatFileSize(selectedFile.size),
          type: selectedFile.type
        } : null
      };

      if (onSendMessage) {
        await onSendMessage(messageData);
      }

      if (selectedFile && onFileUpload) {
        await onFileUpload(selectedFile, selectedContact.id);
      }

      antdMessage.success('Message sent successfully!');
      setMessageText('');
      handleRemoveFile();
      textInputRef.current?.focus();
    } catch (error) {
      console.error('Failed to send message:', error);
      antdMessage.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle emoji select
  const handleEmojiSelect = (emoji) => {
    setMessageText(prev => prev + emoji);
    setShowEmojiPicker(false);
    textInputRef.current?.focus();
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Get file icon based on type
  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) return <FilePdfOutlined style={{ color: '#dc3545' }} />;
    if (fileType.includes('word') || fileType.includes('document')) return <FileWordOutlined style={{ color: '#2b579a' }} />;
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return <FileExcelOutlined style={{ color: '#1d6f42' }} />;
    if (fileType.includes('image')) return <FileImageOutlined style={{ color: '#17a2b8' }} />;
    if (fileType.includes('zip') || fileType.includes('compressed')) return <FileZipOutlined style={{ color: '#ffc107' }} />;
    return <FileOutlined style={{ color: '#6c757d' }} />;
  };

  // Format time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} mins ago`;
    if (hours < 24) return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <section className={styles.chatSection}>
      <div className={styles.container}>
        <div className={styles.chatCard}>
          <div className={styles.cardBody}>
            <div className={styles.chatRow}>
              {/* Sidebar */}
              <div className={styles.sidebar}>
                <div className={styles.sidebarContent}>
                  {/* Search */}
                  <div className={styles.searchGroup}>
                    <input
                      type="search"
                      className={styles.searchInput}
                      placeholder="Search contacts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <SearchOutlined className={styles.searchIcon} />
                  </div>

                  {/* Contacts List */}
                  <div className={styles.contactList}>
                    <div className={styles.scrollContainer}>
                      <ul className={styles.contactsList}>
                        {filteredContacts.map((contact) => (
                          <li
                            key={contact.id}
                            className={`${styles.contactItem} ${selectedContact?.id === contact.id ? styles.active : ''}`}
                            onClick={() => setSelectedContact(contact)}
                          >
                            <div className={styles.contactLink}>
                              <div className={styles.contactInfo}>
                                <div className={styles.avatarWrapper}>
                                  <img
                                    src={contact.avatar}
                                    alt={contact.name}
                                    className={styles.avatar}
                                  />
                                  <span className={`${styles.statusBadge} ${styles[contact.status]}`}></span>
                                </div>
                                <div className={styles.contactDetails}>
                                  <p className={styles.contactName}>{contact.name}</p>
                                  <p className={styles.lastMessage}>{contact.lastMessage}</p>
                                </div>
                              </div>
                              <div className={styles.contactMeta}>
                                <p className={styles.timestamp}>{contact.timestamp}</p>
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
              </div>

              {/* Chat Area */}
              <div className={styles.chatArea}>
                {selectedContact ? (
                  <>
                    {/* Chat Header */}
                    <div className={styles.chatHeader}>
                      <div className={styles.chatHeaderContent}>
                        <img
                          src={selectedContact.avatar}
                          alt={selectedContact.name}
                          className={styles.chatHeaderAvatar}
                        />
                        <div className={styles.chatHeaderInfo}>
                          <h4 className={styles.chatHeaderName}>{selectedContact.name}</h4>
                          <div className={styles.chatHeaderStatus}>
                            {selectedContact.status === 'online' && (
                              <>
                                <span className={styles.onlineDot}></span>
                                <span>Online</span>
                              </>
                            )}
                            {selectedContact.status === 'away' && <span>Away</span>}
                            {selectedContact.status === 'offline' && <span>Offline</span>}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Messages Area */}
                    <div className={styles.messagesArea}>
                      {currentMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`${styles.messageRow} ${msg.isOwn ? styles.sent : styles.received}`}
                        >
                          <img
                            src={msg.senderAvatar}
                            alt={msg.senderName}
                            className={styles.messageAvatar}
                          />
                          <div className={styles.messageContent}>
                            <div className={styles.messageBubble}>
                              <p className={styles.messageText}>{msg.message}</p>
                              
                              {/* File Attachment */}
                              {msg.type === 'file' && msg.file && (
                                <div className={styles.fileAttachment} onClick={() => window.open(msg.file.url, '_blank')}>
                                  <div className={styles.fileIcon}>
                                    {getFileIcon(msg.file.type)}
                                  </div>
                                  <div className={styles.fileInfo}>
                                    <p className={styles.fileName}>{msg.file.name}</p>
                                    <p className={styles.fileSize}>{msg.file.size}</p>
                                  </div>
                                  <DownloadOutlined className={styles.downloadIcon} />
                                </div>
                              )}
                            </div>
                            <p className={styles.messageTime}>
                              <ClockCircleOutlined style={{ fontSize: '12px' }} />
                              {formatMessageTime(msg.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}

                      {/* Typing Indicator */}
                      {isTyping && (
                        <div className={`${styles.messageRow} ${styles.received}`}>
                          <img
                            src={selectedContact.avatar}
                            alt={selectedContact.name}
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
                    <div className={styles.messageInput}>
                      {/* File Preview */}
                      {selectedFile && (
                        <div className={styles.filePreview}>
                          <div className={styles.filePreviewIcon}>
                            {getFileIcon(selectedFile.type)}
                          </div>
                          <div className={styles.filePreviewInfo}>
                            <p className={styles.filePreviewName}>{selectedFile.name}</p>
                            <p className={styles.filePreviewSize}>{formatFileSize(selectedFile.size)}</p>
                          </div>
                          <button className={styles.removeFileButton} onClick={handleRemoveFile}>
                            <CloseCircleOutlined />
                          </button>
                        </div>
                      )}

                      <div className={styles.inputGroup}>
                        <img
                          src={currentUser?.avatar || 'https://i.pravatar.cc/150?img=10'}
                          alt="You"
                          className={styles.inputAvatar}
                        />
                        <div className={styles.inputWrapper}>
                          <input
                            ref={textInputRef}
                            type="text"
                            className={styles.textInput}
                            placeholder="Type your message..."
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={isSending}
                          />
                          <div className={styles.inputActions}>
                            <button
                              className={styles.actionButton}
                              onClick={() => fileInputRef.current?.click()}
                              title="Attach file"
                            >
                              <PaperClipOutlined />
                            </button>
                            <button
                              className={styles.actionButton}
                              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                              title="Add emoji"
                            >
                              <SmileOutlined />
                            </button>
                            <button
                              className={`${styles.actionButton} ${styles.primary}`}
                              onClick={handleSendMessage}
                              disabled={(!messageText.trim() && !selectedFile) || isSending}
                              title="Send message"
                            >
                              {isSending ? <Spin size="small" /> : <SendOutlined />}
                            </button>
                          </div>

                          {/* Emoji Picker */}
                          {showEmojiPicker && (
                            <div className={styles.emojiPicker}>
                              <div className={styles.emojiGrid}>
                                {emojis.map((emoji, index) => (
                                  <button
                                    key={index}
                                    className={styles.emojiButton}
                                    onClick={() => handleEmojiSelect(emoji)}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Hidden File Input */}
                        <input
                          ref={fileInputRef}
                          type="file"
                          className={styles.fileInputHidden}
                          onChange={handleFileSelect}
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.jpg,.jpeg,.png,.gif"
                        />
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
    </section>
  );
};

export default ChatWindowEnhanced;
