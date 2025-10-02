import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Analyze resume content using AI
 * @param {string} content - Resume text content
 * @param {Object} metadata - File metadata (name, type, etc.)
 * @returns {Promise<Object>} Analysis results
 */
export async function analyzeResume(content, metadata = {}) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
You are an expert HR recruiter and career advisor. Analyze the following resume and provide detailed insights.

Resume Content:
${content}

Please provide a comprehensive analysis in JSON format with the following structure:
{
  "summary": "Brief 2-3 sentence professional summary",
  "skills": {
    "technical": ["list of technical skills"],
    "soft": ["list of soft skills"],
    "tools": ["list of tools/technologies"]
  },
  "experience": {
    "totalYears": "estimated total years of experience",
    "level": "Junior/Mid-Level/Senior/Expert",
    "roles": ["list of key roles/positions held"]
  },
  "education": {
    "degrees": ["list of degrees"],
    "institutions": ["list of schools/universities"],
    "certifications": ["list of certifications if any"]
  },
  "strengths": ["list 3-5 key strengths"],
  "areasForImprovement": ["list 2-3 areas to improve"],
  "recommendedRoles": ["list 3-5 job roles this candidate is suitable for"],
  "interviewFocus": ["list 3-5 key areas to focus on during interview"],
  "overallScore": "score from 1-10 based on resume quality and completeness",
  "scoreReasoning": "brief explanation of the score"
}

Respond ONLY with valid JSON, no additional text.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Try to parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from AI response');
    }

    const analysis = JSON.parse(jsonMatch[0]);

    return {
      success: true,
      data: {
        ...analysis,
        analyzedAt: new Date().toISOString(),
        metadata: {
          fileName: metadata.fileName || 'Unknown',
          fileType: metadata.fileType || 'Unknown',
          fileSize: metadata.fileSize || 0
        }
      }
    };
  } catch (error) {
    console.error('AI Analysis Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to analyze resume',
      fallback: {
        summary: 'Resume analysis unavailable - using basic extraction',
        skills: { technical: [], soft: [], tools: [] },
        experience: { totalYears: 'Unknown', level: 'Unknown', roles: [] },
        education: { degrees: [], institutions: [], certifications: [] },
        strengths: ['Experience in the field'],
        areasForImprovement: ['Analysis unavailable'],
        recommendedRoles: ['Pending detailed analysis'],
        interviewFocus: ['General competency assessment'],
        overallScore: 'N/A',
        scoreReasoning: 'AI analysis failed - manual review recommended'
      }
    };
  }
}

/**
 * Extract text content from file buffer based on file type
 * @param {Buffer} fileBuffer - File content buffer
 * @param {string} mimetype - File MIME type
 * @returns {Promise<string>} Extracted text content
 */
export async function extractTextFromFile(fileBuffer, mimetype) {
  try {
    // For now, handle text files directly
    if (mimetype.startsWith('text/') || mimetype === 'application/json') {
      return fileBuffer.toString('utf-8');
    }

    // For PDFs and DOC files, we'd need additional libraries
    // For MVP, return placeholder
    if (mimetype === 'application/pdf') {
      return 'PDF text extraction requires additional library (pdf-parse or similar)';
    }

    if (mimetype === 'application/msword' || 
        mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return 'Word document text extraction requires additional library (mammoth or similar)';
    }

    return 'Unsupported file type for text extraction';
  } catch (error) {
    console.error('Text extraction error:', error);
    return 'Failed to extract text from file';
  }
}

/**
 * Generate interview questions based on resume analysis
 * @param {Object} analysis - Resume analysis results
 * @returns {Promise<Array>} Array of interview questions
 */
export async function generateInterviewQuestions(analysis) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
Based on the following resume analysis, generate 10 targeted interview questions:

Summary: ${analysis.summary || 'No summary available'}
Skills: ${JSON.stringify(analysis.skills || {})}
Experience Level: ${analysis.experience?.level || 'Unknown'}
Roles: ${(analysis.experience?.roles || []).join(', ')}
Focus Areas: ${(analysis.interviewFocus || []).join(', ')}

Generate 10 interview questions that:
1. Test technical skills mentioned in the resume
2. Assess soft skills and cultural fit
3. Explore specific experiences and projects
4. Challenge the candidate appropriately for their level
5. Cover behavioral and situational scenarios

Provide response in JSON format:
{
  "questions": [
    {
      "question": "Question text",
      "category": "Technical/Behavioral/Situational",
      "difficulty": "Easy/Medium/Hard",
      "focusArea": "Specific skill or competency being tested"
    }
  ]
}

Respond ONLY with valid JSON.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from AI response');
    }

    const data = JSON.parse(jsonMatch[0]);
    return {
      success: true,
      questions: data.questions || []
    };
  } catch (error) {
    console.error('Question generation error:', error);
    return {
      success: false,
      error: error.message,
      questions: []
    };
  }
}

export default {
  analyzeResume,
  extractTextFromFile,
  generateInterviewQuestions
};
