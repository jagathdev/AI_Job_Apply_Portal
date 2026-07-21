import { Response } from 'express';
import { Company, SavedJob, AppliedJob, User } from '../models/schemas';
import { analyzeCompanyJD } from '../services/ai/companyAnalysisAI';
import { AuthRequest } from '../middlewares/auth';

// Simple best-effort HTML scraper
async function scrapeJobURL(url: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout for scrape

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Failed to access link (HTTP ${res.status}).`);
    }

    const html = await res.text();
    
    // Simple HTML-to-text conversion: strip styles, scripts, and tags
    let text = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Limit text size
    if (text.length > 10000) {
      text = text.substring(0, 10000);
    }

    if (text.length < 150) {
      throw new Error('Scraped content is too short or empty. May be protected.');
    }

    return text;
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw new Error(err.message || 'Scrape connection failed.');
  }
}

export const analyzeJobDescription = async (req: AuthRequest, res: Response) => {
  const { jdText, jdUrl } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  let finalJdText = jdText || '';

  // Handle best-effort scraper if URL is provided
  if (jdUrl && !jdText) {
    try {
      console.log(`Starting best-effort scrape of: ${jdUrl}`);
      finalJdText = await scrapeJobURL(jdUrl);
    } catch (scrapeError: any) {
      console.warn('Scraper failed or blocked:', scrapeError);
      return res.status(422).json({
        error: 'Unable to auto-fetch job details from this link due to privacy shields or anti-bot rules. Please copy and paste the Job Description text directly instead.',
        code: 'SCRAPE_BLOCKED',
      });
    }
  }

  if (!finalJdText || finalJdText.trim().length < 100) {
    return res.status(400).json({ error: 'Job description must be at least 100 characters long.' });
  }

  const user = await User.findById(userId);
  const customApiKeys = {
    groqApiKey: user?.get('groqApiKey') || undefined,
    geminiApiKey: user?.get('geminiApiKey') || undefined
  };

  const analysis = await analyzeCompanyJD(finalJdText, customApiKeys);

  // Save Company/JD Analysis to MongoDB
  const savedCompany = await Company.create({
    userId,
    ...analysis,
  });

  return res.status(201).json({
    message: 'Job analysis completed successfully.',
    company: savedCompany,
  });
};

export const getAnalyzedCompanies = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const companies = await Company.find({ userId }).sort({ createdAt: -1 });
  return res.status(200).json(companies);
};

export const getCompanyDetails = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const company = await Company.findOne({ _id: id, userId });
  if (!company) {
    return res.status(404).json({ error: 'Analyzed job profile not found.' });
  }

  return res.status(200).json(company);
};

// Saved Job Bookmark Actions
export const saveJob = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { companyName, jobTitle, location, salary, jobDescription } = req.body;

  if (!companyName || !jobTitle) {
    return res.status(400).json({ error: 'Company Name and Job Title are required.' });
  }

  const saved = await SavedJob.create({
    userId,
    companyName,
    jobTitle,
    location,
    salary,
    jobDescription,
  });

  return res.status(201).json({ message: 'Job bookmarked successfully.', saved });
};

export const getSavedJobs = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const list = await SavedJob.find({ userId }).sort({ createdAt: -1 });
  return res.status(200).json(list);
};

export const deleteSavedJob = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  await SavedJob.deleteOne({ _id: id, userId });
  return res.status(200).json({ message: 'Job removed from bookmarks.' });
};

// Applied Jobs Log Actions
export const applyJobLog = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { companyName, jobTitle, status, notes } = req.body;

  if (!companyName || !jobTitle) {
    return res.status(400).json({ error: 'Company Name and Job Title are required.' });
  }

  const applied = await AppliedJob.create({
    userId,
    companyName,
    jobTitle,
    status: status || 'applied',
    notes,
  });

  return res.status(201).json({ message: 'Job application logged successfully.', applied });
};

export const getAppliedJobs = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const list = await AppliedJob.find({ userId }).sort({ appliedDate: -1 });
  return res.status(200).json(list);
};

export const updateAppliedJobStatus = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  const userId = req.user?.id;

  const applied = await AppliedJob.findOne({ _id: id, userId });
  if (!applied) {
    return res.status(404).json({ error: 'Applied job record not found.' });
  }

  if (status) applied.status = status;
  if (notes !== undefined) applied.notes = notes;
  await applied.save();

  return res.status(200).json({ message: 'Job status updated.', applied });
};

export const deleteAppliedJob = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  await AppliedJob.deleteOne({ _id: id, userId });
  return res.status(200).json({ message: 'Job log deleted.' });
};
