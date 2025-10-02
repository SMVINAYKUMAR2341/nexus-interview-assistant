# 🎯 CRISP Interview Assistant - Project Structure

## 📁 Root Directory Structure

```
crisp-interview-assistant/
├── 📂 backend/                    # Express.js Backend Server
│   ├── 📂 config/                 # Configuration files
│   │   └── db.js                  # MongoDB connection setup
│   ├── 📂 controllers/            # Business logic controllers
│   │   ├── authController.js      # Authentication logic
│   │   ├── candidateController.js # Candidate management
│   │   └── interviewController.js # Interview operations
│   ├── 📂 middleware/             # Express middleware
│   │   ├── auth.js                # JWT authentication middleware
│   │   ├── errorHandler.js        # Global error handler
│   │   └── upload.js              # Multer file upload config
│   ├── 📂 models/                 # Mongoose schemas
│   │   ├── Candidate.js           # Candidate data model
│   │   ├── Interview.js           # Interview session model
│   │   └── User.js                # User authentication model
│   ├── 📂 routes/                 # API route definitions
│   │   ├── auth.js                # Authentication routes
│   │   ├── candidates.js          # Candidate CRUD routes
│   │   ├── email.js               # Email notification routes
│   │   ├── interviews.js          # Interview management routes
│   │   └── resume.js              # Resume upload/analysis routes
│   ├── 📂 services/               # Business services
│   │   ├── aiService.js           # AI integration (Gemini/DeepSeek)
│   │   ├── emailService.js        # Email sending service
│   │   └── resumeService.js       # Resume parsing service
│   ├── .env                       # Backend environment variables
│   ├── .npmrc                     # NPM configuration (legacy-peer-deps)
│   ├── package.json               # Backend dependencies
│   └── server.js                  # Express server entry point
│
├── 📂 public/                     # Static assets
│   └── vite.svg                   # Vite logo
│
├── 📂 screenshots/                # Project screenshots
│   └── assessment-start-screen.png
│
├── 📂 src/                        # React Frontend Source
│   ├── 📂 components/             # Reusable React components
│   │   ├── AIChatbot.jsx          # AI chat interface component
│   │   ├── CandidateList.jsx      # List of candidates for interviewer
│   │   ├── CandidateProfile.jsx   # Individual candidate details
│   │   ├── ChatMessage.jsx        # Single chat message component
│   │   ├── ChatWindow.jsx         # Chat interface window
│   │   ├── DataCollectionModal.jsx # Missing info collection modal
│   │   ├── ErrorBoundary.jsx      # React error boundary
│   │   ├── QuestionProgress.jsx   # Question progress indicator
│   │   ├── QuizInterface.jsx      # 6-question assessment UI
│   │   ├── ResultPublishModal.jsx # Results publishing modal
│   │   ├── ResumeAnalysis.jsx     # Resume analysis display
│   │   ├── ResumeUpload.jsx       # Resume upload component
│   │   ├── Timer.jsx              # Question timer component
│   │   └── WelcomeBackModal.jsx   # Returning user modal
│   │
│   ├── 📂 lib/                    # Utility libraries
│   │   ├── aiService.js           # Frontend AI service wrapper
│   │   ├── authService.js         # Authentication API calls
│   │   ├── chatService.js         # Chat API calls
│   │   ├── emailService.js        # Email API calls
│   │   ├── errorUtils.js          # Error handling utilities
│   │   ├── fileUploadService.js   # File upload utilities
│   │   ├── geminiService.js       # Google Gemini AI integration
│   │   └── resumeParser.js        # Resume parsing utilities
│   │
│   ├── 📂 pages/                  # Page-level components
│   │   ├── AuthPageNeon.jsx       # Neon-themed auth page (active)
│   │   ├── IntervieweeView.jsx    # Candidate interview interface
│   │   └── InterviewerView.jsx    # Interviewer management panel
│   │
│   ├── 📂 store/                  # Zustand state management
│   │   ├── useAuthStore.js        # Authentication state
│   │   └── useInterviewStore.js   # Interview/candidate state
│   │
│   ├── 📂 styles/                 # CSS styling files
│   │   ├── auth.css               # Authentication page styles
│   │   ├── IntervieweeNeon.css    # Interviewee panel neon theme
│   │   ├── InterviewerNeon.css    # Interviewer panel neon theme
│   │   ├── QuizInterface.css      # Quiz assessment styles
│   │   ├── ResultPublishModal.css # Results modal styles
│   │   └── ResumeAnalysisNeon.css # Resume analysis styles
│   │
│   ├── App.jsx                    # Main App component
│   ├── index.css                  # Global styles
│   └── main.jsx                   # React entry point
│
├── 📂 node_modules/               # Frontend dependencies (gitignored)
├── 📂 dist/                       # Vite build output (gitignored)
│
├── .env                           # Frontend environment variables
├── .gitignore                     # Git ignore rules
├── .vercel/                       # Vercel deployment config (gitignored)
├── index.html                     # HTML entry point
├── package.json                   # Frontend dependencies & scripts
├── README.md                      # Project documentation
├── vercel.json                    # Vercel deployment configuration
├── vite.config.js                 # Vite build configuration
├── DEPLOYMENT_GUIDE.md            # Deployment instructions
├── SCORE_PUBLISHING_FEATURE.md    # Score publishing documentation
└── RESET_FIX_SUMMARY.md           # Reset functionality docs

```

## 🔑 Key Features by Directory

### **Backend (`/backend`)**
- **Authentication**: JWT-based auth + Google OAuth 2.0
- **Database**: MongoDB Atlas with Mongoose ODM
- **File Upload**: GridFS for resume storage
- **AI Integration**: Google Gemini AI + DeepSeek fallback
- **Email**: Nodemailer with Gmail SMTP
- **API**: RESTful endpoints for interviews, candidates, emails

### **Frontend (`/src`)**
- **Framework**: React 18.2.0 + Vite
- **State**: Zustand with localStorage persistence
- **UI**: Ant Design + Custom Neon CSS theme
- **Routing**: React Router DOM
- **AI Chat**: Real-time chat with Gemini AI
- **Assessment**: 6-question timed quiz (2 easy, 2 medium, 2 hard)

## 📦 Technology Stack

### Frontend
```json
{
  "react": "^18.2.0",
  "react-router-dom": "^6.x",
  "antd": "^5.x",
  "zustand": "^4.x",
  "@react-oauth/google": "^0.x",
  "axios": "^1.x",
  "pdfjs-dist": "^3.x",
  "mammoth": "^1.x"
}
```

### Backend
```json
{
  "express": "^4.18.2",
  "mongoose": "^7.x",
  "jsonwebtoken": "^9.x",
  "bcryptjs": "^2.x",
  "multer": "^1.4.5",
  "multer-gridfs-storage": "^5.x",
  "nodemailer": "^6.x",
  "@google/generative-ai": "^0.x",
  "cors": "^2.x",
  "dotenv": "^16.x"
}
```

## 🌐 Deployment URLs

### Production (Vercel)
- **Main URL**: https://crisp-interview-assistant-sm-vinay-kumars-projects.vercel.app
- **Custom Domain**: https://crisp-interview-assistant-woad.vercel.app
- **GitHub Repository**: https://github.com/SMVINAYKUMAR2341/nexus-interview-assistant

### Local Development
- **Frontend**: http://localhost:5173 (Vite dev server)
- **Backend**: http://localhost:5001 (Express server)

## 🎯 Core Workflows

### 1. **Interviewer Workflow**
```
Sign In → Add Candidates → Upload Resumes → AI Analyzes 
→ Start Interview → Candidate Takes Assessment 
→ View Scores → Publish Results → Send Emails
```

### 2. **Interviewee Workflow**
```
Sign In → Upload Resume (if missing) → Start Assessment 
→ Answer 6 Questions (Timed) → Submit → Wait for Results 
→ View Published Scores
```

### 3. **Score Publishing System**
```
Candidate completes assessment → Scores hidden initially 
→ Interviewer reviews → Clicks "Publish Scores" 
→ Scores become visible to candidates
```

### 4. **Reset Functionality**
```
Interviewer clicks "Reset" → Global state resets to 'idle' 
→ Candidate panel detects reset → Local state cleared 
→ Assessment can be retaken
```

## 📊 Assessment Structure

| Difficulty | Questions | Time per Q | Total Time | Points per Q |
|-----------|-----------|------------|------------|--------------|
| Easy      | 2         | 20s        | 40s        | 0-5          |
| Medium    | 2         | 60s        | 120s       | 0-5          |
| Hard      | 2         | 120s       | 240s       | 0-5          |
| **Total** | **6**     | **-**      | **400s**   | **30**       |

## 🔐 Environment Variables

### Frontend (`.env`)
```env
VITE_GOOGLE_CLIENT_ID=<Google OAuth Client ID>
VITE_API_URL=http://localhost:5001/api
VITE_GEMINI_API_KEY=<Google Gemini API Key>
```

### Backend (`backend/.env`)
```env
MONGODB_URI=<MongoDB Atlas Connection String>
JWT_SECRET=<Your JWT Secret>
GEMINI_API_KEY=<Google Gemini API Key>
DEEPSEEK_API_KEY=<DeepSeek API Key>
GOOGLE_CLIENT_ID=<Google OAuth Client ID>
GOOGLE_CLIENT_SECRET=<Google OAuth Secret>
EMAIL_USER=<Gmail Address>
EMAIL_PASSWORD=<Gmail App Password>
PORT=5001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

## 🚀 Quick Start Commands

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Run development servers (in separate terminals)
npm run dev          # Frontend (Vite)
cd backend && node server.js  # Backend (Express)

# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

## 📝 Important Notes

1. **Score Publishing**: Scores are hidden until interviewer publishes them
2. **Reset Sync**: Both panels sync on reset (uses candidate status priority)
3. **AI Fallback**: DeepSeek AI activates if Gemini fails
4. **File Storage**: Resumes stored in MongoDB GridFS (10MB limit)
5. **Authentication**: JWT tokens (7-day expiry) + Google OAuth
6. **Email**: Gmail SMTP with App Password required

## 🎨 Design Theme

- **Style**: Neon glass-morphism with dark backgrounds
- **Colors**: Purple/Pink neon accents on dark navy/black
- **UI Framework**: Ant Design components with custom CSS
- **Responsive**: Mobile-first design with breakpoints

---

**Created**: October 2, 2025  
**Last Updated**: October 2, 2025  
**Version**: 1.0.0  
**Developer**: NEXUS Team
