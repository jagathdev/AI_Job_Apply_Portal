import { Response } from 'express';
import crypto from 'crypto';
import { Company, SavedJob, AppliedJob, User } from '../models/schemas';
import { analyzeCompanyJD } from '../services/ai/companyAnalysisAI';
import { AuthRequest } from '../middlewares/auth';

// Simple best-effort HTML scraper
async function scrapeJobURL(url: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout for scrape

  try {
    // Use Jina Reader API to bypass common bot protections and extract clean content
    const jinaUrl = `https://r.jina.ai/${url}`;
    let res = await fetch(jinaUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/plain',
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      console.warn(`Jina API failed (HTTP ${res.status}). Attempting direct fetch fallback for ${url}...`);
      res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new Error(`Failed to access link (HTTP ${res.status}).`);
      }
    }

    let text = await res.text();

    clearTimeout(timeoutId);

    // Limit text size to avoid token limit issues
    if (text.length > 20000) {
      text = text.substring(0, 20000);
    }

    // Let the AI decide if the content is valid, even if it's short (e.g. captcha/block page)
    if (!text || text.trim() === '') {
      throw new Error('Scraped content is empty.');
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
      const scrapedText = await scrapeJobURL(jdUrl);
      finalJdText = `Job URL: ${jdUrl}\n\nScraped Content:\n${scrapedText}`;
    } catch (scrapeError: any) {
      console.warn('Scraper failed or blocked:', scrapeError);
      // Fallback: If scraper fails completely, instruct AI to infer from URL slug
      finalJdText = `Job URL: ${jdUrl}\n\n(Note: The website blocked the scraper. Please infer all possible job details purely from the URL slug provided above. Do your best to guess the title, company, location, and requirements based on the URL.)`;
    }
  }

  if (!finalJdText || finalJdText.trim().length < 10) {
    return res.status(400).json({ error: 'Job description text or URL is required.' });
  }

  // Deduplication Check
  const jdHash = crypto.createHash('md5').update(finalJdText.trim()).digest('hex');
  const existingCompany = await Company.findOne({ userId, jdHash });
  if (existingCompany) {
    console.log('Company analysis deduplication hit! Returning existing record.');
    return res.status(200).json({
      message: 'Job analysis loaded from cache successfully.',
      company: existingCompany,
    });
  }

  const user = await User.findById(userId);
  const customApiKeys = {
    groqApiKey: user?.get('groqApiKey') || undefined,
    geminiApiKey: user?.get('geminiApiKey') || undefined
  };

  const analysis = await analyzeCompanyJD(finalJdText, customApiKeys);

  const isUnknown = (str: string) => !str || /^(unknown|n\/a|not provided|not specified)/i.test(str.trim());

  if (analysis.isJobDescription === false || isUnknown(analysis.companyName) || isUnknown(analysis.jobTitle)) {
    return res.status(400).json({
      error: 'The provided link or text does not appear to be a valid job post. Please try a different link or paste the text directly.'
    });
  }

  const companyName = analysis.companyName;
  const jobTitle = analysis.jobTitle;

  // Save Company/JD Analysis to MongoDB
  const savedCompany = await Company.create({
    userId,
    jdHash,
    ...analysis,
    companyName,
    jobTitle,
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
