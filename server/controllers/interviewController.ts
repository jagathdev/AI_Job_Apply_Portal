import { Response } from 'express';
import { InterviewPrep, Resume, Company } from '../models/schemas';
import { generateInterviewPrep } from '../services/ai/interviewAI';
import { callAI } from '../services/ai/grokService';
import { AuthRequest } from '../middlewares/auth';

export const createInterviewPrepGuide = async (req: AuthRequest, res: Response) => {
  const { companyId, resumeId } = req.body;
  const userId = req.user?.id;

  const company = await Company.findOne({ _id: companyId, userId });
  if (!company) {
    return res.status(404).json({ error: 'Analyzed Company Job Profile not found.' });
  }

  const resume = await Resume.findOne({ _id: resumeId, userId });
  if (!resume) {
    return res.status(404).json({ error: 'Selected Resume profile not found.' });
  }

  // Compile full details for AI
  const companyInfo = `Company: ${company.companyName}\nIndustry: ${company.industry}\nOverview: ${company.companyOverview}\nCulture: ${company.workCulture}`;
  const jobTitle = company.jobTitle;
  const jobDescription = `Required Skills: ${company.requiredSkills.join(', ')}\nTech Stack: ${company.techStack.join(', ')}\nOverview: ${company.companyOverview}`;
  const resumeText = `Name: ${resume.personalInfo?.fullName}\nSkills: ${resume.skills.join(', ')}\nExperience:\n${resume.experience.map(e => `${e.role} at ${e.company}: ${e.description}`).join('\n')}`;

  console.log('Sending details to Interview Prep Guide generator...');
  const prepData = await generateInterviewPrep(companyInfo, jobTitle, jobDescription, resumeText);

  const newPrep = await InterviewPrep.create({
    userId,
    companyId,
    ...prepData,
  });

  return res.status(201).json({
    message: 'Interview Preparation Guide generated successfully.',
    guide: newPrep,
  });
};

export const getInterviewGuides = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const guides = await InterviewPrep.find({ userId })
    .populate('companyId', 'companyName jobTitle')
    .sort({ createdAt: -1 });
  return res.status(200).json(guides);
};

export const getInterviewGuideDetails = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const guide = await InterviewPrep.findOne({ _id: id, userId }).populate('companyId', 'companyName jobTitle');
  if (!guide) {
    return res.status(404).json({ error: 'Interview Guide not found.' });
  }

  return res.status(200).json(guide);
};

// Interactive Feature: Evaluates a candidate's custom typewritten answer during mock practice!
export const evaluateMockResponse = async (req: AuthRequest, res: Response) => {
  const { question, userAnswer, category } = req.body;

  if (!question || !userAnswer) {
    return res.status(400).json({ error: 'Question and User Answer are required.' });
  }

  const systemPrompt = `You are an executive interviewer and communication expert.
Analyze the user's mock answer to the provided interview question.
Be constructive, professional, and clear.
Provide feedback on:
1. Score (0 to 100)
2. Clarity and Communication (strengths, weaknesses)
3. Wording Improvements (suggest a polished, highly impressive rewrite of their answer)`;

  const userPrompt = `
QUESTION CATEGORY: ${category || 'General'}
QUESTION: ${question}
CANDIDATE MOCK ANSWER: "${userAnswer}"
`;

  console.log('Evaluating mock interview reply...');
  const feedback = await callAI(systemPrompt, userPrompt, false);

  return res.status(200).json({ feedback });
};
