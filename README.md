# 🚀 NEXUS - AI Interview Assistant

A lightweight React application with AI-powered interview features using **DeepSeek API**.
# 📸 Project Screenshots

## Screenshot 1
![Screenshot 1](https://raw.githubusercontent.com/<your-username>/<your-repo>/main/{1B5684B2-40B7-47D1-A91F-73FD9603A550}.png)

## Screenshot 2
![Screenshot 2](https://raw.githubusercontent.com/<your-username>/<your-repo>/main/{377C86F5-D516-4A20-B537-EA98227BB657}.png)

## Screenshot 3
![Screenshot 3](https://raw.githubusercontent.com/<your-username>/<your-repo>/main/{401E89C6-4507-4AE4-A0E2-2423B0D89B12}.png)

## Screenshot 4
![Screenshot 4](https://raw.githubusercontent.com/<your-username>/<your-repo>/main/{4383CEFF-AEB7-4B20-9681-E57E3FB52698}.png)

## Screenshot 5
![Screenshot 5](https://raw.githubusercontent.com/<your-username>/<your-repo>/main/{49F7D124-FCFB-4B2C-8F64-1193D85B416B}.png)

## Screenshot 6
![Screenshot 6](https://raw.githubusercontent.com/<your-username>/<your-repo>/main/{8B087575-A1A2-4DF9-B092-3DA349CBD158}.png)

## Screenshot 7
![Screenshot 7](https://raw.githubusercontent.com/<your-username>/<your-repo>/main/{90BC9DD1-0738-440F-82B2-EAE3EFAC09D1}.png)

## Screenshot 8
![Screenshot 8](https://raw.githubusercontent.com/<your-username>/<your-repo>/main/{9DE10750-2440-40A3-9B42-0220DF0BADF7}.png)

## Screenshot 9
![Screenshot 9](https://raw.githubusercontent.com/<your-username>/<your-repo>/main/{C748C2F0-1F64-4AF3-8810-12755FE044D5}.png)

## Screenshot 10
![Screenshot 10](https://raw.githubusercontent.com/<your-username>/<your-repo>/main/{E4B48908-607D-43B8-BF84-CAF20F057F98}.png)


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
