import { Response } from 'express';
import { ChatHistory, Resume, Company, User } from '../models/schemas';
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

  let userInfo: any = undefined;
  const user = await User.findById(userId);

  if (activeResumeId) {
    const resume = await Resume.findOne({ _id: activeResumeId, userId });
    if (resume) {
      resumeText = `Name: ${resume.personalInfo?.fullName || user?.name || 'Applicant'}
Email: ${resume.personalInfo?.email || user?.email || 'N/A'}
Phone: ${resume.personalInfo?.phone || user?.mobile || 'N/A'}
Location: ${resume.personalInfo?.location || 'N/A'}
Website/Portfolio: ${resume.personalInfo?.website || 'N/A'}
LinkedIn: ${resume.personalInfo?.linkedIn || 'N/A'}
GitHub: ${resume.personalInfo?.github || 'N/A'}

Summary: ${resume.summary || 'N/A'}

Skills: ${resume.skills?.join(', ') || 'N/A'}

Experience:
${resume.experience?.map((e: any) => `- Role: ${e.role} at Company: ${e.company} (${e.duration || 'N/A'})
  Description: ${e.description || 'N/A'}`).join('\n')}

Projects:
${resume.projects?.map((p: any) => `- Title: ${p.title} (${p.techStack?.join(', ') || 'N/A'})
  Link: ${p.link || 'N/A'}
  Description: ${p.description || 'N/A'}`).join('\n')}

Achievements: ${resume.achievements?.join(', ') || 'N/A'}
Certifications: ${resume.certifications?.join(', ') || 'N/A'}
Languages: ${resume.languages?.join(', ') || 'N/A'}`;
      atsScore = resume.atsScore;

      let degreeStr = '';
      if (resume.education && resume.education.length > 0) {
        const edu = resume.education[0];
        const degName = edu.degree?.trim();
        if (degName) {
          degreeStr = degName.toLowerCase().includes('graduate') ? degName : `${degName} graduate`;
          if (edu.duration) {
            const years = edu.duration.match(/\b(20\d{2})\b/g);
            if (years && years.length > 0) {
              degreeStr = `${years[years.length - 1]} ${degreeStr}`;
            }
          }
        }
      }

      userInfo = {
        name: resume.personalInfo?.fullName || user?.name,
        email: resume.personalInfo?.email || user?.email,
        phone: resume.personalInfo?.phone || user?.mobile,
        location: resume.personalInfo?.location,
        portfolio: resume.personalInfo?.website,
        linkedIn: resume.personalInfo?.linkedIn,
        github: resume.personalInfo?.github,
        degree: degreeStr || '2025 M.Sc. Computer Science graduate'
      };
    }
  }

  if (!userInfo && user) {
    userInfo = {
      name: user.name,
      email: user.email,
      phone: user.mobile
    };
  }

  if (activeCompanyId) {
    const company = await Company.findOne({ _id: activeCompanyId, userId });
    if (company) {
      companyJD = `Company: ${company.companyName}
Role: ${company.jobTitle}
Location: ${company.location || 'N/A'}
Salary Range: ${company.salaryRange || 'N/A'}
Overview: ${company.companyOverview || 'N/A'}
Required Skills: ${company.requiredSkills?.join(', ') || 'N/A'}
Tech Stack: ${company.techStack?.join(', ') || 'N/A'}
Culture: ${company.workCulture || 'N/A'}
Interview Expectations: ${company.interviewExpectations || 'N/A'}`;
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
  
  const customApiKeys = {
    groqApiKey: user?.get('groqApiKey') || undefined,
    geminiApiKey: user?.get('geminiApiKey') || undefined
  };

  console.log('Fetching grounded chatbot reply from Grok AI...');
  const aiReplyText = await generateChatbotResponse(message, chatLogs, {
    resumeText,
    companyJD,
    atsScore,
    userInfo,
    interviewPrep: activeCompanyId ? 'Active Prep Guide Configured' : undefined,
  }, customApiKeys);

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
