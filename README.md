# 🚀 NEXUS - AI Interview Assistant

A lightweight React application with AI-powered interview features using **DeepSeek API**.

## Screenshots

### 1. Role Selection and Sign In / Sign Up
![Role Selection and Sign In](assets/screenshots/screenshot1.png)

### 2. AI Interviewer Dashboard
![AI Interviewer Dashboard](assets/screenshots/screenshot2.png)

### 3. Resume Analytics and Candidate Details
![Resume Analytics and Candidate Details](assets/screenshots/screenshot3.png)

### 4. Assessment Completion
![Assessment Completion](assets/screenshots/screenshot4.png)
## ✨ Features

### For Interviewee
- 📄 Resume upload (PDF/DOCX)
- 🤖 AI-generated interview questions using DeepSeek
- ⏱️ Timed questions with progress tracking
- 📊 Instant AI feedback on answers
- 💬 AI chatbot assistant

### For Interviewers  
- 📈 Candidate dashboard
- 🔍 Filter and search candidates
- 📋 View interview transcripts
- 📊 Performance analytics
- 🏆 Score-based ranking

## 🛠️ Tech Stack

**Frontend:**
- React 18 + Vite
- Ant Design (UI components)
- Zustand (state management)
- **DeepSeek API** (AI integration)

**Backend:**
- Node.js + Express
- MongoDB
- JWT Authentication

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone <repository-url>
cd crisp-interview-assistant
npm install
```

### 2. Setup Environment
Create `backend/.env` file:
```env
DEEPSEEK_API_KEY=your_deepseek_api_key
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

### 3. Start Application
```bash
# Start frontend
npm run dev

# Start backend (in new terminal)
cd backend
npm install
npm run dev
```

### 4. Open Browser
Navigate to `http://localhost:5173`

## 📖 Basic Usage

### For Candidates:
1. Upload your resume
2. Complete profile information  
3. Answer 6 AI-generated questions using DeepSeek
4. Receive instant AI feedback

### For Interviewers:
1. View candidate dashboard
2. Filter by status/score
3. Review interview transcripts
4. Analyze AI-generated summaries

## 🔧 Configuration

### DeepSeek API Setup
1. Visit [DeepSeek Platform](https://platform.deepseek.com/)
2. Create account and get API key
3. Add to `backend/.env`:
```env
DEEPSEEK_API_KEY=sk-your-actual-api-key
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
```

### MongoDB Setup
Use free MongoDB Atlas:
1. Create account at [MongoDB Cloud](https://www.mongodb.com/cloud/atlas)
2. Create cluster
3. Get connection string
4. Add to `backend/.env`

## 🎯 Interview Flow
1. **Easy Questions** (20 sec) - Fundamentals
2. **Medium Questions** (60 sec) - Applied knowledge  
3. **Hard Questions** (120 sec) - Problem solving
4. **AI Evaluation** - Detailed scoring by DeepSeek

## 🤖 DeepSeek AI Features
- Dynamic question generation
- Intelligent answer evaluation  
- Context-aware chatbot
- Candidate assessment summaries
- Real-time AI feedback
