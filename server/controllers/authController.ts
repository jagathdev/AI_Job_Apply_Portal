import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Resume, Company, InterviewPrep } from '../models/schemas';
import { AuthRequest } from '../middlewares/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'ai-job-search-assistant-super-secret-key';

export const register = async (req: any, res: Response) => {
  const { name, email, mobile, password, confirmPassword, acceptTerms } = req.body;

  // Validation
  if (!name || !email || !mobile || !password || !confirmPassword) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
  }

  if (!acceptTerms) {
    return res.status(400).json({ error: 'You must accept the terms and conditions.' });
  }

  // Regex validations
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }

  // Check unique email and mobile
  const existingUser = await User.findOne({ $or: [{ email }, { mobile }] });
  if (existingUser) {
    if (existingUser.email === email) {
      return res.status(400).json({ error: 'Email is already registered.' });
    }
    return res.status(400).json({ error: 'Mobile number is already registered.' });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create User
  const newUser = await User.create({
    name,
    email,
    mobile,
    password: hashedPassword,
    profileCompletion: 35, // Starting profile completion % with registrations
  });

  return res.status(201).json({
    message: 'Registration successful. Please log in.',
    userId: newUser._id,
  });
};

export const login = async (req: any, res: Response) => {
  const { identifier, password } = req.body; // email or mobile

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Please enter Email/Mobile and Password.' });
  }

  // Search by email or mobile
  const user = await User.findOne({
    $or: [{ email: identifier }, { mobile: identifier }],
  });

  if (!user) {
    return res.status(400).json({ error: 'Invalid Email/Mobile or Password.' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ error: 'Invalid Email/Mobile or Password.' });
  }

  // Create JWT token
  const token = jwt.sign(
    { id: user._id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' } // Expires in 7 days
  );

  return res.status(200).json({
    message: 'Login successful.',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      themePreference: user.themePreference,
      avatar: user.avatar,
      profileCompletion: user.profileCompletion,
      subscriptionStatus: user.subscriptionStatus,
    },
  });
};

export const getDashboardSummary = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  // Retrieve user stats
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  // Check counts
  const recentResume = await Resume.findOne({ userId }).sort({ createdAt: -1 });
  const recentCompany = await Company.findOne({ userId }).sort({ createdAt: -1 });
  const recentInterview = await InterviewPrep.findOne({ userId }).sort({ createdAt: -1 });

  // Calculate dynamic completion score
  let score = 35; // base register
  if (user.avatar) score += 10;
  if (recentResume) score += 25;
  if (recentCompany) score += 20;
  if (recentInterview) score += 10;
  if (score > 100) score = 100;

  if (user.profileCompletion !== score) {
    user.profileCompletion = score;
    await user.save();
  }

  // Compile recent activity feed
  const activities = [];
  if (recentResume) {
    activities.push({
      id: 'res-1',
      title: 'Resume Analyzed & Optimized',
      description: `Tailored your resume to ${recentCompany?.companyName || 'latest job'}.`,
      date: recentResume.createdAt,
      type: 'resume',
    });
  }
  if (recentCompany) {
    activities.push({
      id: 'comp-1',
      title: 'Job Description Analyzed',
      description: `Extracted 25+ insights for ${recentCompany.jobTitle} at ${recentCompany.companyName}.`,
      date: recentCompany.createdAt,
      type: 'company',
    });
  }
  if (recentInterview) {
    activities.push({
      id: 'int-1',
      title: 'Interview Prep Guide Prepared',
      description: `Generated rounds, behavior questions & mock sandbox for ${recentCompany?.companyName || 'role'}.`,
      date: recentInterview.createdAt,
      type: 'interview',
    });
  }

  // Default welcome activity if feed is empty
  if (activities.length === 0) {
    activities.push({
      id: 'welcome',
      title: 'Welcome to AI Job Search Assistant!',
      description: 'Upload your resume and paste a target job description to get started.',
      date: user.createdAt,
      type: 'welcome',
    });
  }

  // Sort by date descending
  activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return res.status(200).json({
    user: {
      name: user.name,
      email: user.email,
      profileCompletion: user.profileCompletion,
      subscriptionStatus: user.subscriptionStatus,
      themePreference: user.themePreference,
    },
    stats: {
      hasResume: !!recentResume,
      hasCompany: !!recentCompany,
      hasInterview: !!recentInterview,
      recentResumeId: recentResume?._id || null,
      recentCompanyId: recentCompany?._id || null,
      recentCompanyName: recentCompany?.companyName || null,
      recentJobTitle: recentCompany?.jobTitle || null,
    },
    activities,
  });
};
