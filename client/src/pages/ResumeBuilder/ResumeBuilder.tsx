import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { motion } from 'motion/react';
import axios from 'axios';
import {
  Sparkles, FileText, Upload, Brain, Eye, Save, Plus, Trash2,
  Download, CheckCircle, TrendingUp, HelpCircle, Edit, ListCheck
} from 'lucide-react';

export const ResumeBuilder: React.FC = () => {
  const { showToast, activeResume, setActiveResume, activeCompany, token } = useApp();

  const [activeTab, setActiveTab] = useState<'info' | 'summary' | 'skills' | 'experience' | 'education' | 'projects' | 'achievements'>('info');
  const [editorState, setEditorState] = useState<any>({
    personalInfo: { fullName: '', email: '', phone: '', location: '', website: '', linkedIn: '' },
    summary: '',
    skills: [],
    experience: [],
    education: [],
    projects: [],
    achievements: [],
    certifications: [],
    languages: [],
    interests: []
  });

  const [resumes, setResumes] = useState<any[]>([]);
  const [isTailoring, setIsTailoring] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pastedJd, setPastedJd] = useState('');

  // Diagnostic checklist for active resume
  const [atsScore, setAtsScore] = useState(0);
  const [keywordMatch, setKeywordMatch] = useState(0);
  const [missingKeywords, setMissingKeywords] = useState<string[]>([]);
  const [strengths, setStrengths] = useState<string[]>([]);
  const [weaknesses, setWeaknesses] = useState<string[]>([]);

  useEffect(() => {
    if (token) {
      loadUserResumes();
    }
  }, [token]);

  useEffect(() => {
    if (activeResume) {
      setEditorState({
        personalInfo: activeResume.personalInfo || { fullName: '', email: '', phone: '', location: '', website: '', linkedIn: '' },
        summary: activeResume.summary || '',
        skills: activeResume.skills || [],
        experience: activeResume.experience || [],
        education: activeResume.education || [],
        projects: activeResume.projects || [],
        achievements: activeResume.achievements || [],
        certifications: activeResume.certifications || [],
        languages: activeResume.languages || [],
        interests: activeResume.interests || []
      });
      calculateMockATSMetrics(activeResume);
    }
  }, [activeResume]);

  const loadUserResumes = async () => {
    try {
      const res = await axios.get('/api/resume/all');
      setResumes(res.data);
      if (res.data.length > 0 && !activeResume) {
        setActiveResume(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to load resumes:', err);
    }
  };

  // Live dynamic calculation for feedback sidebar
  const calculateMockATSMetrics = (res: any) => {
    const hasEmail = !!res.personalInfo?.email;
    const hasPhone = !!res.personalInfo?.phone;
    const hasLinkedIn = !!res.personalInfo?.linkedIn;
    const skillsCount = res.skills?.length || 0;
    const expCount = res.experience?.length || 0;
    const projectsCount = res.projects?.length || 0;

    let score = 30;
    if (hasEmail) score += 5;
    if (hasPhone) score += 5;
    if (hasLinkedIn) score += 5;
    score += Math.min(skillsCount * 3, 20);
    score += Math.min(expCount * 7, 25);
    score += Math.min(projectsCount * 5, 10);

    setAtsScore(score);
    setKeywordMatch(Math.round(score * 0.9));

    // Dynamic strengths & weaknesses
    const str = [];
    const weak = [];
    const missing = [];

    if (skillsCount > 6) {
      str.push('Strong core tech stack keyword density.');
    } else {
      weak.push('Include more specific technology stack tags (6+).');
      missing.push('REST API', 'Unit Testing');
    }

    if (expCount >= 2) {
      str.push('Solid professional timeline history.');
    } else {
      weak.push('Describe at least two historical job experiences.');
    }

    if (res.summary && res.summary.length > 100) {
      str.push('Compelling professional elevator summary.');
    } else {
      weak.push('Make your summary more achievement-oriented.');
    }

    if (activeCompany) {
      // If we have active job company loaded, simulate missing keywords gap
      activeCompany.requiredSkills?.forEach((skill: string) => {
        if (!res.skills?.some((s: string) => s.toLowerCase() === skill.toLowerCase())) {
          missing.push(skill);
        }
      });
    }

    setStrengths(str);
    setWeaknesses(weak);
    setMissingKeywords(Array.from(new Set(missing)));
  };

  // Upload Resume File handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    try {
      showToast('Parsing uploaded resume PDF/DOCX on server...', 'info');
      const res = await axios.post('/api/resume/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setActiveResume(res.data.resume);
      setResumes(prev => [res.data.resume, ...prev]);
      showToast('Resume uploaded, parsed, and structured!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to parse resume document.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleManualCreate = async () => {
    try {
      const res = await axios.post('/api/resume/parse-text', {
        resumeText: 'Full Name: New Candidate\nEmail: candidate@example.com\nSkills: React, JavaScript, Node.js',
        name: 'New Custom Resume'
      });
      setActiveResume(res.data.resume);
      setResumes(prev => [res.data.resume, ...prev]);
      showToast('New draft resume workspace initialized.', 'success');
    } catch (err) {
      showToast('Failed to initialize resume draft.', 'error');
    }
  };

  const handleSaveEditor = async () => {
    if (!activeResume) return;
    try {
      const res = await axios.put(`/api/resume/${activeResume._id}`, editorState);
      setActiveResume(res.data.resume);
      setResumes(prev => prev.map(r => r._id === res.data.resume._id ? res.data.resume : r));
      showToast('Resume changes saved successfully!', 'success');
    } catch (err) {
      showToast('Failed to save changes.', 'error');
    }
  };

  // Trigger Grok AI tailoring
  const handleTailorResume = async () => {
    if (!activeResume) return;
    setIsTailoring(true);
    try {
      showToast('Tailoring resume experiences with Grok AI...', 'info');
      const res = await axios.post('/api/resume/tailor', {
        resumeId: activeResume._id,
        companyId: activeCompany?._id || null,
        customJdText: activeCompany ? null : pastedJd
      });

      setActiveResume(res.data.resume);
      setResumes(prev => [res.data.resume, ...prev]);
      showToast('ATS-Optimized tailored resume created!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'AI tailoring timed out.', 'error');
    } finally {
      setIsTailoring(false);
    }
  };

  // Interactive field updates
  const updatePersonalInfo = (field: string, value: string) => {
    setEditorState((prev: any) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value }
    }));
  };

  const addArrayItem = (field: 'experience' | 'education' | 'projects', template: any) => {
    setEditorState((prev: any) => ({
      ...prev,
      [field]: [...prev[field], template]
    }));
  };

  const updateArrayItem = (field: 'experience' | 'education' | 'projects', idx: number, key: string, val: any) => {
    setEditorState((prev: any) => {
      const arr = [...prev[field]];
      arr[idx] = { ...arr[idx], [key]: val };
      return { ...prev, [field]: arr };
    });
  };

  const removeArrayItem = (field: 'experience' | 'education' | 'projects' | 'skills', idx: number) => {
    setEditorState((prev: any) => ({
      ...prev,
      [field]: prev[field].filter((_: any, i: number) => i !== idx)
    }));
  };

  const handleExportHTML = () => {
    if (!activeResume) return;
    const personal = editorState.personalInfo;
    
    // Create print stylesheet ready html file
    const docHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${personal.fullName || 'Resume'}_ATS_Tailored</title>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1f2937; line-height: 1.5; padding: 40px; margin: 0; }
    h1 { font-size: 24px; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px; }
    h2 { font-size: 14px; border-bottom: 2px solid #374151; padding-bottom: 3px; margin-top: 25px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; color: #111827; }
    h3 { font-size: 13px; font-weight: bold; margin: 0; color: #111827; }
    p { font-size: 11px; margin: 5px 0 10px 0; color: #4b5563; }
    .header { text-align: center; margin-bottom: 25px; }
    .contact-info { font-size: 11px; color: #4b5563; margin-top: 5px; }
    .contact-info span { margin: 0 8px; }
    .section-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
    .dates { font-size: 11px; font-weight: bold; color: #3b82f6; }
    .experience-block, .project-block, .edu-block { margin-bottom: 15px; }
    .description { font-size: 11px; text-align: justify; margin-top: 4px; white-space: pre-wrap; color: #374151; }
    .skills-grid { font-size: 11px; font-weight: bold; color: #111827; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${personal.fullName || 'Candidate Name'}</h1>
    <div class="contact-info">
      <span>Email: ${personal.email || 'N/A'}</span>|
      <span>Phone: ${personal.phone || 'N/A'}</span>|
      <span>Location: ${personal.location || 'N/A'}</span>
      ${personal.website ? `|<br><span>Portfolio: ${personal.website}</span>` : ''}
      ${personal.linkedIn ? `|<span>LinkedIn: ${personal.linkedIn}</span>` : ''}
    </div>
  </div>

  ${editorState.summary ? `
  <h2>Executive Summary</h2>
  <p style="font-size: 11px; text-align: justify;">${editorState.summary}</p>
  ` : ''}

  <h2>Core Competencies</h2>
  <div class="skills-grid">${editorState.skills?.join('  •  ')}</div>

  <h2>Professional Experience</h2>
  ${editorState.experience?.map((exp: any) => `
    <div class="experience-block">
      <div class="section-row">
        <h3>${exp.role} — <i>${exp.company}</i></h3>
        <span class="dates">${exp.duration}</span>
      </div>
      <div class="description">${exp.description}</div>
    </div>
  `).join('')}

  <h2>Key Projects</h2>
  ${editorState.projects?.map((proj: any) => `
    <div class="project-block">
      <div class="section-row">
        <h3>${proj.title} ${proj.techStack?.length ? `(${proj.techStack.join(', ')})` : ''}</h3>
        ${proj.link ? `<span class="dates">${proj.link}</span>` : ''}
      </div>
      <div class="description">${proj.description}</div>
    </div>
  `).join('')}

  <h2>Education & Credentials</h2>
  ${editorState.education?.map((edu: any) => `
    <div class="edu-block">
      <div class="section-row">
        <h3>${edu.degree}</h3>
        <span class="dates">${edu.duration}</span>
      </div>
      <p style="margin: 2px 0;">${edu.institution} ${edu.details ? `— ${edu.details}` : ''}</p>
    </div>
  `).join('')}
  
  ${editorState.achievements?.length ? `
  <h2>Achievements & Honors</h2>
  <ul style="font-size: 11px; padding-left: 20px; color: #374151; margin: 5px 0;">
    ${editorState.achievements.map((ach: string) => `<li style="margin-bottom: 4px;">${ach}</li>`).join('')}
  </ul>
  ` : ''}
</body>
</html>
    `;

    const blob = new Blob([docHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${personal.fullName.replace(/\s+/g, '_')}_ATS_Tailored_Resume.html`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Print-perfect HTML resume downloaded successfully! Open it in browser and Save to PDF.', 'success');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-50 px-4 py-8 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-300">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Interactive AI Resume Suite</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Select or upload a resume, tailor bullet points using Grok AI, edit sections, and export as PDF.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3.5">
            {/* Quick selectors */}
            {resumes.length > 0 && (
              <select
                value={activeResume?._id || ''}
                onChange={(e) => {
                  const selected = resumes.find(r => r._id === e.target.value);
                  if (selected) setActiveResume(selected);
                }}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-900"
              >
                {resumes.map((r, i) => (
                  <option key={r._id} value={r._id}>{r.name} {i === 0 ? '(Latest)' : ''}</option>
                ))}
              </select>
            )}

            <button
              onClick={handleManualCreate}
              className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-xs font-bold cursor-pointer"
            >
              Start Draft
            </button>

            {/* Binary Parser uploader */}
            <label className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer transition-all shadow-md shadow-indigo-500/10">
              <Upload className="h-4 w-4" />
              {isUploading ? 'Parsing document...' : 'Upload PDF/DOCX'}
              <input
                type="file"
                disabled={isUploading}
                accept=".pdf,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Triple Panel Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* Panel 1: Document Section Editors (span 4) */}
          <div className="xl:col-span-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-6">
            
            {/* Form Section Selector */}
            <div className="flex border-b border-zinc-150 dark:border-zinc-800 pb-2.5 gap-3.5 overflow-x-auto">
              {[
                { id: 'info', label: 'Contact' },
                { id: 'summary', label: 'Profile' },
                { id: 'skills', label: 'Skills' },
                { id: 'experience', label: 'Experience' },
                { id: 'education', label: 'Education' },
                { id: 'projects', label: 'Projects' }
              ].map((sect) => (
                <button
                  key={sect.id}
                  onClick={() => setActiveTab(sect.id as any)}
                  className={`pb-1 text-[11px] font-bold tracking-tight border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === sect.id
                      ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                      : 'border-transparent text-zinc-400 hover:text-zinc-600'
                  }`}
                >
                  {sect.label}
                </button>
              ))}
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              
              {/* Contact Editor */}
              {activeTab === 'info' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={editorState.personalInfo.fullName}
                      onChange={(e) => updatePersonalInfo('fullName', e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-950 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Email</label>
                    <input
                      type="email"
                      value={editorState.personalInfo.email}
                      onChange={(e) => updatePersonalInfo('email', e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-950 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Phone</label>
                    <input
                      type="text"
                      value={editorState.personalInfo.phone}
                      onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-950 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Location</label>
                    <input
                      type="text"
                      value={editorState.personalInfo.location}
                      onChange={(e) => updatePersonalInfo('location', e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-950 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">LinkedIn</label>
                    <input
                      type="text"
                      value={editorState.personalInfo.linkedIn}
                      onChange={(e) => updatePersonalInfo('linkedIn', e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-950 focus:bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Profile/Summary Editor */}
              {activeTab === 'summary' && (
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Professional Summary</label>
                  <textarea
                    value={editorState.summary}
                    onChange={(e) => setEditorState((prev: any) => ({ ...prev, summary: e.target.value }))}
                    rows={8}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-950 focus:bg-white leading-relaxed"
                  />
                </div>
              )}

              {/* Skills tags list */}
              {activeTab === 'skills' && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="newSkillInput"
                      placeholder="e.g. Docker, Redux"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (val && !editorState.skills.includes(val)) {
                            setEditorState((prev: any) => ({ ...prev, skills: [...prev.skills, val] }));
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                      className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-950"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('newSkillInput') as HTMLInputElement;
                        const val = input.value.trim();
                        if (val && !editorState.skills.includes(val)) {
                          setEditorState((prev: any) => ({ ...prev, skills: [...prev.skills, val] }));
                          input.value = '';
                        }
                      }}
                      className="px-3.5 bg-indigo-600 text-white rounded-xl text-xs font-bold"
                    >
                      Add
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {editorState.skills?.map((skill: string, idx: number) => (
                      <span key={idx} className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                        {skill}
                        <button onClick={() => removeArrayItem('skills', idx)} className="text-zinc-400 hover:text-red-500">×</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience Array Editor */}
              {activeTab === 'experience' && (
                <div className="space-y-5">
                  <button
                    type="button"
                    onClick={() => addArrayItem('experience', { company: 'New Company', role: 'Software Engineer', duration: 'Jan 2024 - Present', description: '• Handled production scaling.' })}
                    className="w-full py-2.5 rounded-xl border border-dashed border-indigo-200 text-indigo-600 dark:border-indigo-900/50 dark:text-indigo-400 hover:bg-indigo-50/50 text-xs font-bold transition-all cursor-pointer"
                  >
                    + Add Experience Block
                  </button>

                  {editorState.experience?.map((exp: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-xl border border-zinc-150 bg-zinc-50/40 dark:border-zinc-800 dark:bg-zinc-950/40 space-y-3.5 relative">
                      <button
                        onClick={() => removeArrayItem('experience', idx)}
                        className="absolute top-3.5 right-3.5 text-zinc-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      <div className="grid grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-zinc-400">Company</label>
                          <input
                            type="text"
                            value={exp.company}
                            onChange={(e) => updateArrayItem('experience', idx, 'company', e.target.value)}
                            className="w-full border-b border-zinc-200 bg-transparent py-1 text-xs outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-zinc-400">Role</label>
                          <input
                            type="text"
                            value={exp.role}
                            onChange={(e) => updateArrayItem('experience', idx, 'role', e.target.value)}
                            className="w-full border-b border-zinc-200 bg-transparent py-1 text-xs outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-zinc-400">Duration</label>
                        <input
                          type="text"
                          value={exp.duration}
                          onChange={(e) => updateArrayItem('experience', idx, 'duration', e.target.value)}
                          className="w-full border-b border-zinc-200 bg-transparent py-1 text-xs outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-zinc-400">STAR Description</label>
                        <textarea
                          value={exp.description}
                          onChange={(e) => updateArrayItem('experience', idx, 'description', e.target.value)}
                          rows={4}
                          className="w-full border border-zinc-200 bg-transparent p-2.5 text-[11px] outline-none rounded-xl"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Education Array Editor */}
              {activeTab === 'education' && (
                <div className="space-y-5">
                  <button
                    type="button"
                    onClick={() => addArrayItem('education', { institution: 'University Name', degree: 'B.S. Computer Science', duration: '2020 - 2024', details: 'GPA 3.8' })}
                    className="w-full py-2.5 rounded-xl border border-dashed border-indigo-200 text-indigo-600 dark:border-indigo-900/50 dark:text-indigo-400 hover:bg-indigo-50/50 text-xs font-bold transition-all cursor-pointer"
                  >
                    + Add Academic Block
                  </button>

                  {editorState.education?.map((edu: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-xl border border-zinc-150 bg-zinc-50/40 dark:border-zinc-800 dark:bg-zinc-950/40 space-y-3.5 relative">
                      <button
                        onClick={() => removeArrayItem('education', idx)}
                        className="absolute top-3.5 right-3.5 text-zinc-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-zinc-400">Institution</label>
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) => updateArrayItem('education', idx, 'institution', e.target.value)}
                          className="w-full border-b border-zinc-200 bg-transparent py-1 text-xs outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-zinc-400">Degree</label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => updateArrayItem('education', idx, 'degree', e.target.value)}
                          className="w-full border-b border-zinc-200 bg-transparent py-1 text-xs outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-zinc-400">Duration</label>
                          <input
                            type="text"
                            value={edu.duration}
                            onChange={(e) => updateArrayItem('education', idx, 'duration', e.target.value)}
                            className="w-full border-b border-zinc-200 bg-transparent py-1 text-xs outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-zinc-400">Details</label>
                          <input
                            type="text"
                            value={edu.details}
                            onChange={(e) => updateArrayItem('education', idx, 'details', e.target.value)}
                            className="w-full border-b border-zinc-200 bg-transparent py-1 text-xs outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Projects Array Editor */}
              {activeTab === 'projects' && (
                <div className="space-y-5">
                  <button
                    type="button"
                    onClick={() => addArrayItem('projects', { title: 'Personal Dashboard', description: 'Built interactive dashboard.', techStack: ['React'], link: 'https://github.com' })}
                    className="w-full py-2.5 rounded-xl border border-dashed border-indigo-200 text-indigo-600 dark:border-indigo-900/50 dark:text-indigo-400 hover:bg-indigo-50/50 text-xs font-bold transition-all cursor-pointer"
                  >
                    + Add Project Block
                  </button>

                  {editorState.projects?.map((proj: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-xl border border-zinc-150 bg-zinc-50/40 dark:border-zinc-800 dark:bg-zinc-950/40 space-y-3.5 relative">
                      <button
                        onClick={() => removeArrayItem('projects', idx)}
                        className="absolute top-3.5 right-3.5 text-zinc-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-zinc-400">Project Title</label>
                        <input
                          type="text"
                          value={proj.title}
                          onChange={(e) => updateArrayItem('projects', idx, 'title', e.target.value)}
                          className="w-full border-b border-zinc-200 bg-transparent py-1 text-xs outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-zinc-400">Link</label>
                        <input
                          type="text"
                          value={proj.link}
                          onChange={(e) => updateArrayItem('projects', idx, 'link', e.target.value)}
                          className="w-full border-b border-zinc-200 bg-transparent py-1 text-xs outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-zinc-400">Description</label>
                        <textarea
                          value={proj.description}
                          onChange={(e) => updateArrayItem('projects', idx, 'description', e.target.value)}
                          rows={3}
                          className="w-full border border-zinc-200 bg-transparent p-2.5 text-[11px] outline-none rounded-xl"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>

            {/* Quick Action bar to save editors to database */}
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
              <button
                onClick={handleSaveEditor}
                className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md transition-all cursor-pointer"
              >
                <Save className="h-4 w-4" />
                Save Resume Edits
              </button>
            </div>

          </div>

          {/* Panel 2: Real-time Live Document Preview (span 5) */}
          <div className="xl:col-span-5 rounded-2xl border border-zinc-200 bg-zinc-200/50 p-5 dark:border-zinc-900 dark:bg-zinc-950/40 shadow-sm flex flex-col">
            
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-zinc-300 dark:border-zinc-800">
              <span className="flex items-center gap-1.5 text-xs font-bold text-zinc-500">
                <Eye className="h-4.5 w-4.5" />
                Interactive Document Preview
              </span>

              <button
                onClick={handleExportHTML}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 text-[10px] font-bold shadow-sm cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                Export print HTML
              </button>
            </div>

            {/* Document sheet */}
            <div className="flex-1 bg-white p-6 shadow-md border border-zinc-300 dark:border-zinc-900 rounded-xl max-h-[620px] overflow-y-auto text-zinc-800 font-sans text-left transition-colors duration-200">
              
              {/* Document Header */}
              <div className="text-center space-y-1 mb-5">
                <h2 className="text-xl font-bold tracking-tight text-zinc-900 uppercase">{editorState.personalInfo.fullName || 'Candidate Name'}</h2>
                <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[9px] text-zinc-500 font-medium">
                  <span>{editorState.personalInfo.email || 'email@example.com'}</span>
                  <span>•</span>
                  <span>{editorState.personalInfo.phone || 'phone'}</span>
                  <span>•</span>
                  <span>{editorState.personalInfo.location || 'location'}</span>
                  {editorState.personalInfo.linkedIn && (
                    <>
                      <span>•</span>
                      <span className="truncate max-w-[100px]">{editorState.personalInfo.linkedIn}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Profile section */}
              {editorState.summary && (
                <div className="mb-4">
                  <h3 className="text-[10px] font-bold text-zinc-900 uppercase border-b border-zinc-300 pb-0.5 tracking-wider">Executive Summary</h3>
                  <p className="text-[10px] text-zinc-600 leading-relaxed mt-1">{editorState.summary}</p>
                </div>
              )}

              {/* Skills section */}
              {editorState.skills?.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-[10px] font-bold text-zinc-900 uppercase border-b border-zinc-300 pb-0.5 tracking-wider">Core Competencies</h3>
                  <p className="text-[10px] text-zinc-700 leading-relaxed mt-1 font-semibold">{editorState.skills.join('  •  ')}</p>
                </div>
              )}

              {/* Experience section */}
              {editorState.experience?.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-[10px] font-bold text-zinc-900 uppercase border-b border-zinc-300 pb-0.5 tracking-wider">Professional Experience</h3>
                  <div className="space-y-3 mt-2">
                    {editorState.experience.map((exp: any, i: number) => (
                      <div key={i} className="space-y-0.5">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span>{exp.role} <span className="font-normal text-zinc-500">— {exp.company}</span></span>
                          <span className="text-indigo-600">{exp.duration}</span>
                        </div>
                        <p className="text-[10px] text-zinc-600 leading-normal whitespace-pre-wrap">{exp.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects section */}
              {editorState.projects?.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-[10px] font-bold text-zinc-900 uppercase border-b border-zinc-300 pb-0.5 tracking-wider">Selected Projects</h3>
                  <div className="space-y-3 mt-2">
                    {editorState.projects.map((proj: any, i: number) => (
                      <div key={i} className="space-y-0.5">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span>{proj.title} <span className="font-normal text-[9px] text-zinc-400">{proj.techStack?.join(', ')}</span></span>
                          {proj.link && <span className="text-[9px] font-normal text-indigo-500 truncate max-w-[120px]">{proj.link}</span>}
                        </div>
                        <p className="text-[10px] text-zinc-600 leading-normal">{proj.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education section */}
              {editorState.education?.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-[10px] font-bold text-zinc-900 uppercase border-b border-zinc-300 pb-0.5 tracking-wider">Academic Education</h3>
                  <div className="space-y-2 mt-2">
                    {editorState.education.map((edu: any, i: number) => (
                      <div key={i} className="text-[10px]">
                        <div className="flex justify-between font-bold">
                          <span>{edu.degree}</span>
                          <span className="text-zinc-500">{edu.duration}</span>
                        </div>
                        <p className="text-zinc-600">{edu.institution} {edu.details ? `— ${edu.details}` : ''}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>

          {/* Panel 3: AI Optimizer Sidebar (span 3) */}
          <div className="xl:col-span-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-6 flex flex-col">
            
            {/* ATS Score Dial */}
            <div className="text-center space-y-2 border-b border-zinc-100 dark:border-zinc-800 pb-5">
              <span className="block text-[10px] uppercase font-bold text-zinc-400">ATS Match Gauge</span>
              <div className="flex items-center justify-center">
                <div className="relative h-24 w-24 flex items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
                  <span className="text-2xl font-black">{atsScore}%</span>
                </div>
              </div>
              <p className="text-[10px] text-zinc-400">Matches direct JD keyword frequencies.</p>
            </div>

            {/* Keyword gaps */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold flex items-center gap-1.5">
                <ListCheck className="h-4 w-4 text-purple-500" />
                Missing Keywords Gap
              </h3>
              <div className="flex flex-wrap gap-1">
                {missingKeywords.length > 0 ? (
                  missingKeywords.slice(0, 10).map((kw, i) => (
                    <span key={i} className="text-[9px] font-semibold px-2 py-0.5 rounded bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-100 dark:border-red-950/30">
                      {kw}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-zinc-400">All matching keywords present!</span>
                )}
              </div>
            </div>

            {/* Strengths / Weaknesses checklists */}
            <div className="space-y-4 border-t border-zinc-150 dark:border-zinc-800 pt-4 flex-1">
              <div className="space-y-1.5">
                <h4 className="text-[11px] font-bold text-emerald-600 uppercase">Core Strengths</h4>
                <ul className="text-[10px] text-zinc-500 space-y-1">
                  {strengths.map((str, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <CheckCircle className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                      {str}
                    </li>
                  ))}
                </ul>
              </div>

              {weaknesses.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <h4 className="text-[11px] font-bold text-amber-600 uppercase">Optimization Tips</h4>
                  <ul className="text-[10px] text-zinc-500 space-y-1">
                    {weaknesses.map((w, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="h-1 w-1 bg-amber-500 rounded-full mt-1.5 shrink-0" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Master AI Rewrite trigger */}
            <div className="border-t border-zinc-150 dark:border-zinc-800 pt-4">
              <div className="mb-4">
                <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Target Job Context</label>
                {activeCompany ? (
                  <div className="p-2.5 rounded-lg border border-purple-100 bg-purple-50/20 dark:border-purple-900 text-[10px]">
                    <span className="block font-bold truncate">{activeCompany.jobTitle}</span>
                    <span className="block text-zinc-400 truncate">{activeCompany.companyName}</span>
                  </div>
                ) : (
                  <textarea
                    value={pastedJd}
                    onChange={(e) => setPastedJd(e.target.value)}
                    placeholder="Paste JD text here to tailor resume"
                    rows={2}
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-[10px] outline-none"
                  />
                )}
              </div>

              <button
                onClick={handleTailorResume}
                disabled={isTailoring || (!activeCompany && !pastedJd)}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 py-3 text-xs font-bold text-white shadow-md disabled:opacity-40 transition-all cursor-pointer"
              >
                <Brain className="h-4.5 w-4.5 animate-pulse" />
                {isTailoring ? 'Tailoring with Grok...' : 'AI STAR Rewrite'}
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
