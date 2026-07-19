import { callAI } from './grokService';

export interface InterviewRound {
  name: string;
  description: string;
}

export interface TechnicalQuestion {
  question: string;
  answer: string;
  category: string;
}

export interface HRQuestion {
  question: string;
  answer: string;
}

export interface BehavioralQuestion {
  question: string;
  situation: string;
  task: string;
  action: string;
  result: string;
}

export interface CodingQuestion {
  title: string;
  description: string;
  solution: string;
  hint: string;
}

export interface ScenarioQuestion {
  scenario: string;
  approach: string;
}

export interface PracticeProject {
  title: string;
  description: string;
  techStack: string[];
}

export interface LearningResource {
  topic: string;
  link: string;
  type: string;
}

export interface InterviewPrepResult {
  interviewRounds: InterviewRound[];
  technicalQuestions: TechnicalQuestion[];
  hrQuestions: HRQuestion[];
  behavioralQuestions: BehavioralQuestion[];
  codingQuestions: CodingQuestion[];
  scenarioQuestions: ScenarioQuestion[];
  roleExpectations: string;
  mustLearnTopics: string[];
  recommendedProjects: PracticeProject[];
  learningResources: LearningResource[];
  confidenceTips: string[];
}

export async function generateInterviewPrep(
  companyInfo: string,
  jobTitle: string,
  jobDescription: string,
  userResume: string
): Promise<InterviewPrepResult> {
  const systemPrompt = `You are an elite Lead Engineer and Technical Recruiter.
Generate an exhaustive, highly tailored, premium interview preparation guide based on the company's profile, job description, and the user's specific resume and experience.

Your guide MUST contain actual detailed questions and highly personalized answers reflecting both the job's demands AND the candidate's actual projects.

You must return your response strictly as a JSON object matching this structure:
{
  "interviewRounds": [
    { "name": "Technical Screen", "description": "30-min coding & core knowledge check" }
  ],
  "technicalQuestions": [
    { "name": "System Design", "question": "Technical question", "answer": "Personalized, technically accurate answer", "category": "React / System Design / Databases / Node" }
  ],
  "hrQuestions": [
    { "question": "Tell me about yourself?", "answer": "Personalized answer tailoring the candidate's resume to this role" }
  ],
  "behavioralQuestions": [
    { 
      "question": "Describe a difficult conflict or technical challenge.",
      "situation": "Detailed Situation based on user's resume",
      "task": "Detailed Task based on user's resume",
      "action": "Detailed Action based on user's resume",
      "result": "Detailed Result based on user's resume"
    }
  ],
  "codingQuestions": [
    { "title": "Implement debounce in React", "description": "Create a reusable hook or utility...", "solution": "JavaScript code snippet solution", "hint": "Think about cleanup in useEffect" }
  ],
  "scenarioQuestions": [
    { "scenario": "Our database connection spikes during sales events.", "approach": "Implement connection pooling, caching, and rate limiting..." }
  ],
  "roleExpectations": "Detailed expectations statement of what is expected from someone in this role day-to-day",
  "mustLearnTopics": ["Topic 1", "Topic 2"],
  "recommendedProjects": [
    { "title": "Project Title", "description": "Highly relevant learning project description", "techStack": ["React", "Express"] }
  ],
  "learningResources": [
    { "topic": "System Design Primer", "link": "https://github.com/donnemartin/system-design-primer", "type": "Repo/Video" }
  ],
  "confidenceTips": ["Tip 1", "Tip 2"]
}`;

  const userPrompt = `
COMPANY PROFILE:
${companyInfo}

JOB TITLE:
${jobTitle}

JOB DESCRIPTION:
${jobDescription}

USER RESUME / EXPERIENCES:
${userResume}
`;

  const aiResponse = await callAI(systemPrompt, userPrompt, true);
  try {
    return JSON.parse(aiResponse) as InterviewPrepResult;
  } catch (err) {
    const match = aiResponse.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]) as InterviewPrepResult;
    }
    throw new Error('Failed to parse Interview Prep guide JSON.');
  }
}
