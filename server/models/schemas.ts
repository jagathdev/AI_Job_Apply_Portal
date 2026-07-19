import mongoose, { Schema } from 'mongoose';

// User Schema
const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  mobile: { type: String, required: true },
  password: { type: String, required: true },
  profileCompletion: { type: Number, default: 20 },
  createdAt: { type: Date, default: Date.now },
  themePreference: { type: String, default: 'dark' },
  avatar: { type: String, default: '' },
  subscriptionStatus: { type: String, default: 'free' }
});

// Company / JD Analysis Schema
const CompanySchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  companyName: { type: String, required: true },
  jobTitle: { type: String, required: true },
  department: { type: String, default: 'N/A' },
  location: { type: String, default: 'N/A' },
  employmentType: { type: String, default: 'Full-time' },
  salaryRange: { type: String, default: 'Estimated' },
  companyOverview: { type: String, default: '' },
  currentProjects: { type: [String], default: [] },
  products: { type: [String], default: [] },
  techStack: { type: [String], default: [] },
  requiredSkills: { type: [String], default: [] },
  preferredSkills: { type: [String], default: [] },
  interviewExpectations: { type: String, default: '' },
  hiringProcess: { type: [String], default: [] },
  employeeStrength: { type: String, default: 'N/A' },
  companyRatings: { type: String, default: 'N/A' },
  workCulture: { type: String, default: '' },
  benefits: { type: [String], default: [] },
  workingHours: { type: String, default: 'Flexible' },
  glassdoorSummary: { type: String, default: '' },
  careerGrowth: { type: String, default: '' },
  companyWebsite: { type: String, default: '' },
  linkedIn: { type: String, default: '' },
  industry: { type: String, default: 'Technology' },
  competitors: { type: [String], default: [] },
  hiringTrends: { type: String, default: '' },
  importantNotes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

// Resume Schema
const ResumeSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, default: 'My Resume' },
  rawText: { type: String, default: '' },
  personalInfo: {
    fullName: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    location: { type: String, default: '' },
    website: { type: String, default: '' },
    linkedIn: { type: String, default: '' }
  },
  summary: { type: String, default: '' },
  skills: { type: [String], default: [] },
  experience: [{
    company: String,
    role: String,
    duration: String,
    description: String
  }],
  education: [{
    institution: String,
    degree: String,
    duration: String,
    details: String
  }],
  projects: [{
    title: String,
    description: String,
    techStack: [String],
    link: String
  }],
  achievements: { type: [String], default: [] },
  certifications: { type: [String], default: [] },
  languages: { type: [String], default: [] },
  interests: { type: [String], default: [] },
  atsScore: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// ATS Report Schema
const ATSReportSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  resumeId: { type: Schema.Types.ObjectId, ref: 'Resume' },
  companyId: { type: Schema.Types.ObjectId, ref: 'Company' },
  overallScore: { type: Number, required: true },
  skillsMatchScore: { type: Number, required: true },
  keywordMatchScore: { type: Number, required: true },
  missingKeywords: { type: [String], default: [] },
  importantSkills: { type: [String], default: [] },
  suggestions: { type: [String], default: [] },
  actionItems: [{
    task: String,
    completed: { type: Boolean, default: false }
  }],
  createdAt: { type: Date, default: Date.now }
});

// Interview Preparation Schema
const InterviewPrepSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  interviewRounds: [{
    name: String,
    description: String
  }],
  technicalQuestions: [{
    question: String,
    answer: String,
    category: String
  }],
  hrQuestions: [{
    question: String,
    answer: String
  }],
  behavioralQuestions: [{
    question: String,
    situation: String,
    task: String,
    action: String,
    result: String
  }],
  codingQuestions: [{
    title: String,
    description: String,
    solution: String,
    hint: String
  }],
  scenarioQuestions: [{
    scenario: String,
    approach: String
  }],
  roleExpectations: { type: String, default: '' },
  mustLearnTopics: { type: [String], default: [] },
  recommendedProjects: [{
    title: String,
    description: String,
    techStack: [String]
  }],
  learningResources: [{
    topic: String,
    link: String,
    type: { type: String, default: 'Article' }
  }],
  confidenceTips: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now }
});

// Chat History Schema
const ChatHistorySchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  messages: [{
    sender: { type: String, enum: ['user', 'ai'], required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

// Saved / Applied Jobs Schema
const SavedJobSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  companyName: { type: String, required: true },
  jobTitle: { type: String, required: true },
  location: { type: String },
  salary: { type: String },
  jobDescription: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const AppliedJobSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  companyName: { type: String, required: true },
  jobTitle: { type: String, required: true },
  status: { type: String, enum: ['applied', 'interviewing', 'offered', 'rejected'], default: 'applied' },
  appliedDate: { type: Date, default: Date.now },
  notes: { type: String, default: '' }
});

// AI Prompt Caching Schema (expires items automatically after 7 days)
const AICacheSchema = new Schema({
  key: { type: String, required: true, unique: true, index: true },
  response: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 604800 } // 7 days in seconds
});

export const User = mongoose.model('User', UserSchema);
export const Company = mongoose.model('Company', CompanySchema);
export const Resume = mongoose.model('Resume', ResumeSchema);
export const ATSReport = mongoose.model('ATSReport', ATSReportSchema);
export const InterviewPrep = mongoose.model('InterviewPrep', InterviewPrepSchema);
export const ChatHistory = mongoose.model('ChatHistory', ChatHistorySchema);
export const SavedJob = mongoose.model('SavedJob', SavedJobSchema);
export const AppliedJob = mongoose.model('AppliedJob', AppliedJobSchema);
export const AICache = mongoose.model('AICache', AICacheSchema);
