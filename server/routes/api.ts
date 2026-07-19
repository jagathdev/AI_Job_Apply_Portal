import { Router } from 'express';
import { register, login, getDashboardSummary } from '../controllers/authController';
import {
  analyzeJobDescription,
  getAnalyzedCompanies,
  getCompanyDetails,
  saveJob,
  getSavedJobs,
  deleteSavedJob,
  applyJobLog,
  getAppliedJobs,
  updateAppliedJobStatus,
  deleteAppliedJob
} from '../controllers/companyController';
import {
  uploadAndParseResume,
  parseTextResume,
  getResumes,
  getResumeDetails,
  updateResume,
  deleteResume,
  tailorResumeToJob
} from '../controllers/resumeController';
import {
  createATSReport,
  getATSReports,
  getATSReportDetails,
  toggleActionItem
} from '../controllers/atsController';
import {
  createInterviewPrepGuide,
  getInterviewGuides,
  getInterviewGuideDetails,
  evaluateMockResponse
} from '../controllers/interviewController';
import {
  sendChatMessage,
  getChatHistory,
  clearChatHistory
} from '../controllers/chatController';
import {
  getProfile,
  updateProfile,
  changePassword,
  exportUserData,
  deleteAccount
} from '../controllers/profileController';

import { authenticateToken } from '../middlewares/auth';
import { upload } from '../middlewares/upload';
import { asyncHandler } from '../middlewares/error';

const router = Router();

// ==========================================
// 1. AUTHENTICATION & DASHBOARD
// ==========================================
router.post('/auth/register', asyncHandler(register));
router.post('/auth/login', asyncHandler(login));
router.get('/auth/dashboard-summary', authenticateToken as any, asyncHandler(getDashboardSummary));

// ==========================================
// 2. COMPANY & JD ANALYSIS
// ==========================================
router.post('/company/analyze', authenticateToken as any, asyncHandler(analyzeJobDescription));
router.get('/company/all', authenticateToken as any, asyncHandler(getAnalyzedCompanies));
router.get('/company/:id', authenticateToken as any, asyncHandler(getCompanyDetails));

// Saved Job Bookmarks
router.post('/company/saved/add', authenticateToken as any, asyncHandler(saveJob));
router.get('/company/saved/all', authenticateToken as any, asyncHandler(getSavedJobs));
router.delete('/company/saved/:id', authenticateToken as any, asyncHandler(deleteSavedJob));

// Applied Jobs Log Tracker
router.post('/company/applied/add', authenticateToken as any, asyncHandler(applyJobLog));
router.get('/company/applied/all', authenticateToken as any, asyncHandler(getAppliedJobs));
router.put('/company/applied/:id', authenticateToken as any, asyncHandler(updateAppliedJobStatus));
router.delete('/company/applied/:id', authenticateToken as any, asyncHandler(deleteAppliedJob));

// ==========================================
// 3. RESUME BUILDER & OPTIMIZER
// ==========================================
router.post('/resume/upload', authenticateToken as any, upload.single('file'), asyncHandler(uploadAndParseResume));
router.post('/resume/parse-text', authenticateToken as any, asyncHandler(parseTextResume));
router.get('/resume/all', authenticateToken as any, asyncHandler(getResumes));
router.get('/resume/:id', authenticateToken as any, asyncHandler(getResumeDetails));
router.put('/resume/:id', authenticateToken as any, asyncHandler(updateResume));
router.delete('/resume/:id', authenticateToken as any, asyncHandler(deleteResume));
router.post('/resume/tailor', authenticateToken as any, asyncHandler(tailorResumeToJob));

// ==========================================
// 4. ATS SCORE MATRIX
// ==========================================
router.post('/ats/analyze', authenticateToken as any, asyncHandler(createATSReport));
router.get('/ats/all', authenticateToken as any, asyncHandler(getATSReports));
router.get('/ats/:id', authenticateToken as any, asyncHandler(getATSReportDetails));
router.put('/ats/:id/toggle/:itemId', authenticateToken as any, asyncHandler(toggleActionItem));

// ==========================================
// 5. INTERVIEW PRACTICE SANDBOX
// ==========================================
router.post('/interview/generate', authenticateToken as any, asyncHandler(createInterviewPrepGuide));
router.get('/interview/all', authenticateToken as any, asyncHandler(getInterviewGuides));
router.get('/interview/:id', authenticateToken as any, asyncHandler(getInterviewGuideDetails));
router.post('/interview/evaluate-response', authenticateToken as any, asyncHandler(evaluateMockResponse));

// ==========================================
// 6. GLOBAL CONTEXT CHATBOT
// ==========================================
router.post('/chat/send', authenticateToken as any, asyncHandler(sendChatMessage));
router.get('/chat/history', authenticateToken as any, asyncHandler(getChatHistory));
router.delete('/chat/clear', authenticateToken as any, asyncHandler(clearChatHistory));

// ==========================================
// 7. USER PROFILE & GDPR DATA EXPORT
// ==========================================
router.get('/profile', authenticateToken as any, asyncHandler(getProfile));
router.put('/profile', authenticateToken as any, asyncHandler(updateProfile));
router.put('/profile/security', authenticateToken as any, asyncHandler(changePassword));
router.get('/profile/export', authenticateToken as any, asyncHandler(exportUserData));
router.post('/profile/delete', authenticateToken as any, asyncHandler(deleteAccount));

export default router;
