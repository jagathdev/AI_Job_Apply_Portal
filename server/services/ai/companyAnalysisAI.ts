import { callAI, CustomApiKeys } from './grokService';

export interface CompanyAnalysisResult {
  companyName: string;
  jobTitle: string;
  department: string;
  location: string;
  employmentType: string;
  salaryRange: string;
  companyOverview: string;
  currentProjects: string[];
  products: string[];
  techStack: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  interviewExpectations: string;
  hiringProcess: string[];
  employeeStrength: string;
  companyRatings: string;
  workCulture: string;
  benefits: string[];
  workingHours: string;
  glassdoorSummary: string;
  careerGrowth: string;
  companyWebsite: string;
  linkedIn: string;
  industry: string;
  competitors: string[];
  hiringTrends: string;
  importantNotes: string;
}

export async function analyzeCompanyJD(
  jobDescriptionText: string,
  customApiKeys?: CustomApiKeys
): Promise<CompanyAnalysisResult> {
  const systemPrompt = `You are an expert AI recruiter and corporate intelligence analyst.
Analyze the following Job Description (JD) text and extract detailed company/role information.
You must return your response STRICTLY as a JSON object matching this EXACT structure. If any field is not present in the text, you must use your extensive industry knowledge to estimate or infer realistic values based on the company or industry, but clearly mark those inferred fields or keep them highly aligned with reality.

Structure to return:
{
  "companyName": "Name of the company",
  "jobTitle": "Job Title",
  "department": "Department (e.g. Engineering, Product, Sales)",
  "location": "Location (e.g. Remote, New York, Hybrid)",
  "employmentType": "Full-time / Part-time / Contract / Internship",
  "salaryRange": "Estimated salary range (e.g. $120k - $150k + Equity), marked as estimated if inferred",
  "companyOverview": "A professional paragraph summarizing what the company does, its mission and standing",
  "currentProjects": ["Project 1", "Project 2"],
  "products": ["Product A", "Product B"],
  "techStack": ["React", "TypeScript", "Node.js", "Express", "MongoDB"],
  "requiredSkills": ["Skill A", "Skill B"],
  "preferredSkills": ["Skill X", "Skill Y"],
  "interviewExpectations": "A summary of what interviewers look for (e.g., solid system design skills, cultural alignment)",
  "hiringProcess": ["Step 1: Recruiter Call", "Step 2: Technical Interview", "Step 3: System Design", "Step 4: Culture Fit & Offer"],
  "employeeStrength": "Estimated company size (e.g., 500-1000 employees)",
  "companyRatings": "Estimated Glassdoor rating (e.g., 4.2/5)",
  "workCulture": "A paragraph describing the work culture (e.g., collaborative, fast-paced, high autonomy)",
  "benefits": ["Benefit 1", "Benefit 2"],
  "workingHours": "Flexible / Standard 9-5 / etc.",
  "glassdoorSummary": "A concise reviews summary reflecting employee sentiments, pros and cons",
  "careerGrowth": "Career path and growth opportunities within this company and role",
  "companyWebsite": "Estimated or real website URL",
  "linkedIn": "Estimated or real LinkedIn URL",
  "industry": "Industry category",
  "competitors": ["Competitor A", "Competitor B"],
  "hiringTrends": "Hiring status or trends for this company",
  "importantNotes": "Any critical tips, red flags, or advice for the applicant"
}`;

  const userPrompt = `Job Description Text to analyze:\n\n${jobDescriptionText}`;

  const aiResponse = await callAI(systemPrompt, userPrompt, true, customApiKeys);
  try {
    return JSON.parse(aiResponse) as CompanyAnalysisResult;
  } catch (err) {
    console.error('Failed to parse Company JD analysis JSON, attempting cleanup...', err);
    // Try to extract JSON if it was wrapped in markdown ```json ... ```
    const match = aiResponse.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]) as CompanyAnalysisResult;
    }
    throw new Error('AI response was not valid JSON');
  }
}
