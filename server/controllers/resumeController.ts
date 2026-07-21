import { Response } from 'express';
import * as _pdfParse from 'pdf-parse';
const pdfParse: any = (_pdfParse as any).default || _pdfParse;
import mammoth from 'mammoth';
import { Resume, Company, User } from '../models/schemas';
import { parseResumeText, rewriteResume } from '../services/ai/resumeAI';
import { AuthRequest } from '../middlewares/auth';

// Helper to extract text based on file format
async function extractTextFromBuffer(buffer: Buffer, mimetype: string): Promise<string> {
  if (mimetype === 'application/pdf') {
    const data = await pdfParse(buffer);
    return data.text || '';
  } else if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimetype === 'application/msword'
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  }
  throw new Error('Unsupported mime type for resume extraction.');
}

export const uploadAndParseResume = async (req: any, res: Response) => {
  const userId = req.user?.id;
  if (!req.file) {
    return res.status(400).json({ error: 'Please upload a PDF or DOCX file.' });
  }

  try {
    console.log(`Extracting raw text from resume: ${req.file.originalname} (${req.file.mimetype})`);
    const rawText = await extractTextFromBuffer(req.file.buffer, req.file.mimetype);

    if (!rawText || rawText.trim().length < 50) {
      return res.status(422).json({ error: 'Failed to extract text. The document might be scanned/empty.' });
    }

    const user = await User.findById(userId);
    const customApiKeys = {
      groqApiKey: user?.get('groqApiKey') || undefined,
      geminiApiKey: user?.get('geminiApiKey') || undefined
    };

    console.log('Sending extracted text to Grok AI for structuring...');
    const parsedResume = await parseResumeText(rawText, customApiKeys);

    // Save to database
    const savedResume = await Resume.create({
      userId,
      name: req.file.originalname.replace(/\.[^/.]+$/, ""), // Strip file extension
      rawText,
      ...parsedResume,
    });

    return res.status(201).json({
      message: 'Resume parsed and saved successfully.',
      resume: savedResume,
    });
  } catch (error: any) {
    console.error('Error during resume upload and parse:', error);
    return res.status(500).json({ error: error.message || 'Failed to parse resume.' });
  }
};

// Paste text resume manually
export const parseTextResume = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { resumeText, name } = req.body;

  if (!resumeText || resumeText.trim().length < 50) {
    return res.status(400).json({ error: 'Resume text must be at least 50 characters.' });
  }

  const user = await User.findById(userId);
  const customApiKeys = {
    groqApiKey: user?.get('groqApiKey') || undefined,
    geminiApiKey: user?.get('geminiApiKey') || undefined
  };

  console.log('Parsing manually pasted resume...');
  const parsedResume = await parseResumeText(resumeText, customApiKeys);

  const savedResume = await Resume.create({
    userId,
    name: name || 'My Resume',
    rawText: resumeText,
    ...parsedResume,
  });

  return res.status(201).json({
    message: 'Resume parsed and saved successfully.',
    resume: savedResume,
  });
};

export const getResumes = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const resumes = await Resume.find({ userId }).sort({ createdAt: -1 });
  return res.status(200).json(resumes);
};

export const getResumeDetails = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const resume = await Resume.findOne({ _id: id, userId });
  if (!resume) {
    return res.status(404).json({ error: 'Resume profile not found.' });
  }

  return res.status(200).json(resume);
};

export const updateResume = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const updateData = req.body;

  const resume = await Resume.findOne({ _id: id, userId });
  if (!resume) {
    return res.status(404).json({ error: 'Resume profile not found.' });
  }

  // Update fields dynamically
  Object.assign(resume, updateData);
  await resume.save();

  return res.status(200).json({
    message: 'Resume updated successfully.',
    resume,
  });
};

export const deleteResume = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  await Resume.deleteOne({ _id: id, userId });
  return res.status(200).json({ message: 'Resume deleted successfully.' });
};

// Tailor Resume to Job Description
export const tailorResumeToJob = async (req: AuthRequest, res: Response) => {
  const { resumeId, companyId, customJdText } = req.body;
  const userId = req.user?.id;

  const resume = await Resume.findOne({ _id: resumeId, userId });
  if (!resume) {
    return res.status(404).json({ error: 'Resume not found.' });
  }

  let jobDescription = '';
  if (companyId) {
    const company = await Company.findOne({ _id: companyId, userId });
    if (company) {
      jobDescription = `${company.jobTitle} at ${company.companyName}\nRequired: ${company.requiredSkills.join(', ')}\nOverview: ${company.companyOverview}`;
    }
  } else if (customJdText) {
    jobDescription = customJdText;
  }

  if (!jobDescription || jobDescription.trim().length < 50) {
    return res.status(400).json({ error: 'Please provide a valid Job Description or Company ID.' });
  }

  console.log('Sending Resume + JD to Grok AI for premium tailored rewrite...');
  const currentResumeData = {
    personalInfo: resume.personalInfo as any,
    summary: resume.summary,
    skills: resume.skills,
    experience: resume.experience as any[],
    education: resume.education as any[],
    projects: resume.projects as any[],
    achievements: resume.achievements,
    certifications: resume.certifications,
    languages: resume.languages,
    interests: resume.interests,
  };

  const user = await User.findById(userId);
  const customApiKeys = {
    groqApiKey: user?.get('groqApiKey') || undefined,
    geminiApiKey: user?.get('geminiApiKey') || undefined
  };

  const rewrittenData = await rewriteResume(currentResumeData, jobDescription, customApiKeys);

  // Save tailored resume as a new document
  const savedTailored = await Resume.create({
    userId,
    name: `${resume.name} (ATS Tailored)`,
    rawText: resume.rawText,
    ...rewrittenData,
  });

  return res.status(201).json({
    message: 'Resume tailored and optimized successfully!',
    resume: savedTailored,
  });
};
