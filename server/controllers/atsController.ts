import { Response } from 'express';
import { ATSReport, Resume, Company, User } from '../models/schemas';
import { generateATSReport } from '../services/ai/atsScoreAI';
import { AuthRequest } from '../middlewares/auth';

export const createATSReport = async (req: AuthRequest, res: Response) => {
  const { resumeId, companyId, customJdText } = req.body;
  const userId = req.user?.id;

  const resume = await Resume.findOne({ _id: resumeId, userId });
  if (!resume) {
    return res.status(404).json({ error: 'Selected Resume not found.' });
  }

  let jobDescriptionText = '';
  let companyName = 'General Role';
  let jobTitle = 'Target Job';

  if (companyId) {
    const company = await Company.findOne({ _id: companyId, userId });
    if (company) {
      companyName = company.companyName;
      jobTitle = company.jobTitle;
      jobDescriptionText = `Company: ${company.companyName}\nRole: ${company.jobTitle}\nOverview: ${company.companyOverview}\nRequired Skills: ${company.requiredSkills.join(', ')}\nTech Stack: ${company.techStack.join(', ')}`;
    }
  } else if (customJdText) {
    jobDescriptionText = customJdText;
  }

  if (!jobDescriptionText || jobDescriptionText.trim().length < 50) {
    return res.status(400).json({ error: 'Please select a valid Job Description or enter a custom text.' });
  }

  // Compile full string from resume fields to feed to ATS engine
  const resumeString = `
Name: ${resume.personalInfo?.fullName || ''}
Summary: ${resume.summary || ''}
Skills: ${resume.skills?.join(', ') || ''}
Experience: ${resume.experience?.map(e => `${e.role} at ${e.company}: ${e.description}`).join('\n') || ''}
Projects: ${resume.projects?.map(p => `${p.title} (${p.techStack?.join(', ')}): ${p.description}`).join('\n') || ''}
  `;

  const user = await User.findById(userId);
  const customApiKeys = {
    groqApiKey: user?.get('groqApiKey') || undefined,
    geminiApiKey: user?.get('geminiApiKey') || undefined
  };

  console.log('Sending resume compile to ATS analysis engine...');
  const reportData = await generateATSReport(resumeString, jobDescriptionText, customApiKeys);

  const report = await ATSReport.create({
    userId,
    resumeId,
    companyId: companyId || null,
    ...reportData,
  });

  // Update original resume score
  resume.atsScore = reportData.overallScore;
  await resume.save();

  return res.status(201).json({
    message: 'ATS analysis completed successfully.',
    report,
  });
};

export const getATSReports = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const list = await ATSReport.find({ userId })
    .populate('resumeId', 'name')
    .populate('companyId', 'companyName jobTitle')
    .sort({ createdAt: -1 });
  return res.status(200).json(list);
};

export const getATSReportDetails = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const report = await ATSReport.findOne({ _id: id, userId })
    .populate('resumeId', 'name')
    .populate('companyId', 'companyName jobTitle');
    
  if (!report) {
    return res.status(404).json({ error: 'ATS Report not found.' });
  }

  return res.status(200).json(report);
};

export const toggleActionItem = async (req: AuthRequest, res: Response) => {
  const { id, itemId } = req.params;
  const userId = req.user?.id;

  const report = await ATSReport.findOne({ _id: id, userId });
  if (!report) {
    return res.status(404).json({ error: 'ATS Report not found.' });
  }

  const actionItem = report.actionItems.id(itemId) as any;
  if (!actionItem) {
    return res.status(404).json({ error: 'Action checklist item not found.' });
  }

  actionItem.completed = !actionItem.completed;
  await report.save();

  return res.status(200).json({ message: 'Action item toggled successfully.', report });
};
