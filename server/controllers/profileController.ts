import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { User, Resume, Company, ATSReport, InterviewPrep, SavedJob, AppliedJob, ChatHistory } from '../models/schemas';
import { AuthRequest } from '../middlewares/auth';

export const getProfile = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const user = await User.findById(userId).select('-password');
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }
  const userObj = user.toObject() as any;
  return res.status(200).json({
    ...userObj,
    groqApiKey: userObj.groqApiKey ? `${userObj.groqApiKey.substring(0, 6)}...` : '',
    geminiApiKey: userObj.geminiApiKey ? `${userObj.geminiApiKey.substring(0, 6)}...` : '',
    groqApiKeySet: !!userObj.groqApiKey,
    geminiApiKeySet: !!userObj.geminiApiKey
  });
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { name, mobile, avatar, themePreference } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  if (name) user.name = name;
  if (mobile) user.mobile = mobile;
  if (avatar !== undefined) user.avatar = avatar;
  if (themePreference) user.themePreference = themePreference;

  await user.save();

  return res.status(200).json({
    message: 'Profile updated successfully.',
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

export const updateApiKeys = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { groqApiKey, geminiApiKey } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  if (groqApiKey !== undefined) user.set('groqApiKey', groqApiKey);
  if (geminiApiKey !== undefined) user.set('geminiApiKey', geminiApiKey);

  await user.save();

  return res.status(200).json({
    message: 'API keys updated successfully.',
    groqApiKeySet: !!user.get('groqApiKey'),
    geminiApiKeySet: !!user.get('geminiApiKey'),
  });
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Please enter current and new passwords.' });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return res.status(400).json({ error: 'Current password is incorrect.' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  return res.status(200).json({ message: 'Password updated successfully.' });
};

// Compile a beautiful JSON data package of everything the user has done on the platform
export const exportUserData = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  const user = await User.findById(userId).select('-password');
  const resumes = await Resume.find({ userId });
  const companies = await Company.find({ userId });
  const reports = await ATSReport.find({ userId });
  const interviews = await InterviewPrep.find({ userId });
  const savedJobs = await SavedJob.find({ userId });
  const appliedJobs = await AppliedJob.find({ userId });

  const exportPackage = {
    profile: user,
    resumes,
    companies,
    atsReports: reports,
    interviewPreparations: interviews,
    savedJobs,
    appliedJobs,
    exportedAt: new Date(),
  };

  return res.status(200).json(exportPackage);
};

// Cleanly delete everything associated with the user
export const deleteAccount = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { confirmationPassword } = req.body;

  if (!confirmationPassword) {
    return res.status(400).json({ error: 'Password confirmation is required to delete your account.' });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const isMatch = await bcrypt.compare(confirmationPassword, user.password);
  if (!isMatch) {
    return res.status(400).json({ error: 'Incorrect confirmation password. Account deletion aborted.' });
  }

  // Delete all records cascade
  await Resume.deleteMany({ userId });
  await Company.deleteMany({ userId });
  await ATSReport.deleteMany({ userId });
  await InterviewPrep.deleteMany({ userId });
  await SavedJob.deleteMany({ userId });
  await AppliedJob.deleteMany({ userId });
  await ChatHistory.deleteMany({ userId });
  await User.deleteOne({ _id: userId });

  return res.status(200).json({ message: 'Your account and all associated job-seeking data have been permanently deleted.' });
};
