import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const QUESTION_TIMERS = {
  easy: 20,
  medium: 60,
  hard: 120
};

export const useInterviewStore = create(
  persist(
    (set, get) => ({
      // State
      candidates: [],
      activeCandidateId: null,
      interviewState: 'idle', // 'idle' | 'collecting-info' | 'ready' | 'active' | 'paused' | 'finished'
      timer: 0,
      timerInterval: null,
      currentQuestionIndex: 0,
      showWelcomeBack: false,

      // Actions
      addCandidate: (candidateData, userId = null) => {
        const newCandidate = {
          id: Date.now().toString(),
          name: candidateData.name || '',
          email: candidateData.email || '',
          phone: candidateData.phone || '',
          status: 'pending', // 'pending' | 'in-progress' | 'completed'
          chatHistory: [],
          finalScore: null,
          summary: '',
          currentQuestionIndex: 0,
          answers: [],
          createdAt: new Date().toISOString(),
          resumeData: candidateData.resumeData || null,
          missingFields: [],
          assignedUserId: userId, // Link candidate to authenticated user
          scoresPublished: false // Track if scores have been published to interviewee
        };

        set((state) => ({
          candidates: [...state.candidates, newCandidate],
          activeCandidateId: newCandidate.id
        }));

        return newCandidate.id;
      },

      updateCandidate: (candidateId, updates) => {
        set((state) => ({
          candidates: state.candidates.map((candidate) =>
            candidate.id === candidateId
              ? { ...candidate, ...updates }
              : candidate
          )
        }));
      },

      setActiveCandidateId: (candidateId) => {
        set({ activeCandidateId: candidateId });
      },

      addChatMessage: (candidateId, message) => {
        set((state) => ({
          candidates: state.candidates.map((candidate) =>
            candidate.id === candidateId
              ? {
                  ...candidate,
                  chatHistory: [...candidate.chatHistory, {
                    id: Date.now().toString(),
                    timestamp: new Date().toISOString(),
                    ...message
                  }]
                }
              : candidate
          )
        }));
      },

      setInterviewState: (newState) => {
        set({ interviewState: newState });
      },

      startInterview: (candidateId) => {
        const state = get();
        const candidate = state.candidates.find(c => c.id === candidateId);
        
        if (!candidate) return;

        // Check if candidate has all required info
        const missingFields = [];
        if (!candidate.name) missingFields.push('name');
        if (!candidate.email) missingFields.push('email');
        if (!candidate.phone) missingFields.push('phone');

        if (missingFields.length > 0) {
          state.updateCandidate(candidateId, { missingFields });
          state.setInterviewState('collecting-info');
          return;
        }

        // Start the interview
        state.updateCandidate(candidateId, { 
          status: 'in-progress',
          currentQuestionIndex: 0 
        });
        state.setInterviewState('active');
        state.setCurrentQuestionIndex(0);
        
        // Start timer for first question
        const questionType = state.getQuestionType(0);
        state.startTimer(QUESTION_TIMERS[questionType]);
      },

      nextQuestion: (candidateId) => {
        const state = get();
        const candidate = state.candidates.find(c => c.id === candidateId);
        
        if (!candidate) return;

        const nextIndex = candidate.currentQuestionIndex + 1;
        
        if (nextIndex >= 6) {
          // Interview complete
          state.finishInterview(candidateId);
          return;
        }

        state.updateCandidate(candidateId, { currentQuestionIndex: nextIndex });
        state.setCurrentQuestionIndex(nextIndex);
        
        // Start timer for next question
        const questionType = state.getQuestionType(nextIndex);
        state.startTimer(QUESTION_TIMERS[questionType]);
      },

      finishInterview: (candidateId) => {
        const state = get();
        state.updateCandidate(candidateId, { status: 'completed' });
        state.setInterviewState('finished');
        state.stopTimer();
        
        // Calculate final score and generate summary
        const candidate = state.candidates.find(c => c.id === candidateId);
        if (candidate) {
          const finalScore = state.calculateFinalScore(candidate.answers || []);
          const summary = state.generateSummary(candidate);
          state.updateCandidate(candidateId, { finalScore, summary });
        }
      },

      submitAnswer: (candidateId, answer, questionIndex) => {
        const state = get();
        const candidate = state.candidates.find(c => c.id === candidateId);
        
        if (!candidate) return;

        const questionType = state.getQuestionType(questionIndex);
        const score = state.evaluateAnswer(answer, questionType);
        
        const answerData = {
          questionIndex,
          answer,
          score,
          questionType,
          timeUsed: QUESTION_TIMERS[questionType] - state.timer,
          timestamp: new Date().toISOString()
        };

        const updatedAnswers = [...(candidate.answers || []), answerData];
        state.updateCandidate(candidateId, { answers: updatedAnswers });

        // Add to chat history
        state.addChatMessage(candidateId, {
          type: 'user',
          text: answer,
          score,
          feedback: state.generateFeedback(score, questionType)
        });

        state.stopTimer();
        state.nextQuestion(candidateId);
      },

      pauseInterview: () => {
        const state = get();
        state.stopTimer();
        state.setInterviewState('paused');
      },

      resumeInterview: () => {
        const state = get();
        const activeCandidateId = state.activeCandidateId;
        const candidate = state.candidates.find(c => c.id === activeCandidateId);
        
        if (candidate && candidate.status === 'in-progress') {
          state.setInterviewState('active');
          const questionType = state.getQuestionType(candidate.currentQuestionIndex);
          state.startTimer(QUESTION_TIMERS[questionType]);
        }
      },

      // Timer functions
      setTimer: (seconds) => {
        set({ timer: seconds });
      },

      startTimer: (seconds) => {
        const state = get();
        state.stopTimer(); // Clear any existing timer
        
        set({ timer: seconds });
        
        const interval = setInterval(() => {
          const currentState = get();
          if (currentState.timer <= 0) {
            currentState.stopTimer();
            // Auto-submit empty answer when time runs out
            const candidateId = currentState.activeCandidateId;
            const candidate = currentState.candidates.find(c => c.id === candidateId);
            if (candidate) {
              currentState.submitAnswer(candidateId, '', candidate.currentQuestionIndex);
            }
          } else {
            set({ timer: currentState.timer - 1 });
          }
        }, 1000);
        
        set({ timerInterval: interval });
      },

      stopTimer: () => {
        const state = get();
        if (state.timerInterval) {
          clearInterval(state.timerInterval);
          set({ timerInterval: null });
        }
      },

      setCurrentQuestionIndex: (index) => {
        set({ currentQuestionIndex: index });
      },

      // Utility functions
      getQuestionType: (questionIndex) => {
        if (questionIndex < 2) return 'easy';
        if (questionIndex < 4) return 'medium';
        return 'hard';
      },

      evaluateAnswer: (answer, questionType) => {
        // Mock AI evaluation - in real app this would call an AI service
        // Returns score out of 5
        if (!answer || answer.trim().length === 0) return 0;
        
        // Base scores out of 5 for different difficulties
        const baseScore = questionType === 'easy' ? 4 : questionType === 'medium' ? 3.5 : 3;
        const randomVariation = (Math.random() * 1) - 0.5; // -0.5 to +0.5
        return Math.max(0, Math.min(5, baseScore + randomVariation));
      },

      calculateFinalScore: (answers) => {
        if (!answers || answers.length === 0) return 0;
        // Sum up all scores (out of 5 each) to get total out of 30 (6 questions × 5 points)
        const totalScore = answers.reduce((sum, answer) => sum + (answer.score || 0), 0);
        return Math.round(totalScore * 10) / 10; // Round to 1 decimal place
      },

      generateSummary: (candidate) => {
        const answers = candidate.answers || [];
        const totalScore = get().calculateFinalScore(answers);
        const maxScore = 30; // 6 questions × 5 points each
        const percentage = (totalScore / maxScore) * 100;
        
        let performance = 'Poor';
        if (percentage >= 80) performance = 'Excellent';
        else if (percentage >= 60) performance = 'Good';
        else if (percentage >= 40) performance = 'Fair';
        
        return `Candidate ${candidate.name} completed the Full Stack Developer interview with ${performance} performance. Total score: ${totalScore}/30 (${Math.round(percentage)}%). Answered ${answers.length}/6 questions.`;
      },

      generateFeedback: (score, questionType) => {
        // Score is out of 5
        if (score === 0) return 'No answer provided within time limit.';
        if (score >= 4.5) return 'Excellent answer! Well structured and comprehensive.';
        if (score >= 3.5) return 'Good answer with solid understanding.';
        if (score >= 2.5) return 'Fair answer, could use more detail.';
        if (score >= 1.5) return 'Needs improvement. Consider more specific examples.';
        return 'Answer needs significant improvement.';
      },

      // Welcome back functionality
      setShowWelcomeBack: (show) => {
        set({ showWelcomeBack: show });
      },

      checkForIncompleteSession: () => {
        const state = get();
        const incompleteCandidate = state.candidates.find(
          c => c.status === 'in-progress' && state.activeCandidateId === c.id
        );
        
        if (incompleteCandidate) {
          set({ showWelcomeBack: true });
        }
      },

      // Search and filter functions
      searchCandidates: (searchTerm) => {
        const state = get();
        if (!searchTerm) return state.candidates;
        
        return state.candidates.filter(candidate =>
          candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          candidate.phone.includes(searchTerm)
        );
      },

      sortCandidates: (candidates, sortBy, sortOrder = 'desc') => {
        return [...candidates].sort((a, b) => {
          let aValue = a[sortBy];
          let bValue = b[sortBy];
          
          if (sortBy === 'finalScore') {
            aValue = aValue || 0;
            bValue = bValue || 0;
          }
          
          if (sortBy === 'createdAt') {
            aValue = new Date(aValue).getTime();
            bValue = new Date(bValue).getTime();
          }
          
          if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });
      },

      // Reset functions
      resetInterview: () => {
        const state = get();
        state.stopTimer();
        set({
          activeCandidateId: null,
          interviewState: 'idle',
          timer: 0,
          currentQuestionIndex: 0
        });
      },

      clearAllData: () => {
        const state = get();
        state.stopTimer();
        set({
          candidates: [],
          activeCandidateId: null,
          interviewState: 'idle',
          timer: 0,
          timerInterval: null,
          currentQuestionIndex: 0,
          showWelcomeBack: false
        });
      },

      // Get candidates for specific user (for auth integration)
      getCandidatesForUser: (userId) => {
        const { candidates } = get();
        return candidates.filter(candidate => 
          candidate.assignedUserId === userId || !candidate.assignedUserId
        );
      },

      // Reset a candidate's assessment (for interviewer)
      resetCandidateAssessment: (candidateId) => {
        const state = get();
        
        // Stop timer if it's running
        if (state.timerInterval) {
          clearInterval(state.timerInterval);
        }
        
        // Always reset the interview state and current question index
        // This ensures the interviewee can restart from beginning
        set({ 
          interviewState: 'idle',
          currentQuestionIndex: 0,
          timer: 0,
          timerInterval: null
        });
        
        // Reset all candidate data
        set((state) => ({
          candidates: state.candidates.map((candidate) =>
            candidate.id === candidateId
              ? {
                  ...candidate,
                  status: 'pending',
                  interviewState: 'idle', // Add candidate-specific state
                  chatHistory: [],
                  finalScore: null,
                  summary: '',
                  currentQuestionIndex: 0,
                  answers: [],
                  missingFields: [],
                  scores: [], // Reset individual question scores
                  scoresPublished: false // Reset scores published flag
                }
              : candidate
          )
        }));
      },

      // Publish scores to interviewee
      publishScores: (candidateId) => {
        set((state) => ({
          candidates: state.candidates.map((candidate) =>
            candidate.id === candidateId
              ? { ...candidate, scoresPublished: true }
              : candidate
          )
        }));
      },

      // Clear data on logout
      clearUserData: () => {
        const state = get();
        state.stopTimer();
        set({
          candidates: [],
          activeCandidateId: null,
          interviewState: 'idle',
          timer: 0,
          timerInterval: null,
          currentQuestionIndex: 0,
          showWelcomeBack: false
        });
      }
    }),
    {
      name: 'crisp-interview-storage',
      partialize: (state) => ({
        candidates: state.candidates,
        activeCandidateId: state.activeCandidateId,
        interviewState: state.interviewState,
        currentQuestionIndex: state.currentQuestionIndex,
        showWelcomeBack: state.showWelcomeBack
      })
    }
  )
);