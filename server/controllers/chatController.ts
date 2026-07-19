import { Response } from 'express';
import { ChatHistory, Resume, Company } from '../models/schemas';
import { generateChatbotResponse } from '../services/ai/chatbotAI';
import { AuthRequest } from '../middlewares/auth';

export const sendChatMessage = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { message, activeResumeId, activeCompanyId } = req.body;

  if (!message || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message cannot be empty.' });
  }

  // 1. Fetch active context if requested
  let resumeText = '';
  let companyJD = '';
  let atsScore: number | undefined;

  if (activeResumeId) {
    const resume = await Resume.findOne({ _id: activeResumeId, userId });
    if (resume) {
      resumeText = `Skills: ${resume.skills.join(', ')}\nExperience: ${resume.experience.map(e => `${e.role} at ${e.company}`).join(', ')}`;
      atsScore = resume.atsScore;
    }
  }

  if (activeCompanyId) {
    const company = await Company.findOne({ _id: activeCompanyId, userId });
    if (company) {
      companyJD = `Company: ${company.companyName}\nRole: ${company.jobTitle}\nSkills: ${company.requiredSkills.join(', ')}\nCulture: ${company.workCulture}`;
    }
  }

  // 2. Load or bootstrap User's Chat History
  let history = await ChatHistory.findOne({ userId });
  if (!history) {
    history = await ChatHistory.create({ userId, messages: [] });
  }

  // Push user message
  history.messages.push({ sender: 'user', text: message, timestamp: new Date() });

  // 3. Compile history and query context chatbot
  const chatLogs = history.messages.map(m => ({ sender: m.sender as 'user' | 'ai', text: m.text }));
  
  console.log('Fetching grounded chatbot reply from Grok AI...');
  const aiReplyText = await generateChatbotResponse(message, chatLogs, {
    resumeText,
    companyJD,
    atsScore,
    interviewPrep: activeCompanyId ? 'Active Prep Guide Configured' : undefined,
  });

  // Push AI message
  history.messages.push({ sender: 'ai', text: aiReplyText, timestamp: new Date() });
  await history.save();

  return res.status(200).json({
    reply: aiReplyText,
    history: history.messages,
  });
};

export const getChatHistory = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  let history = await ChatHistory.findOne({ userId });
  if (!history) {
    history = await ChatHistory.create({ userId, messages: [] });
  }
  return res.status(200).json(history.messages);
};

export const clearChatHistory = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  await ChatHistory.deleteOne({ userId });
  return res.status(200).json({ message: 'Chat history cleared successfully.', history: [] });
};
