import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import axios from 'axios';
import {
  Sparkles, FileText, Upload, Brain, Eye, Save, Plus, Trash2,
  Download, CheckCircle, TrendingUp, HelpCircle, Edit, ListCheck, ArrowLeft
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

  const generateHTMLTemplate = () => {
    const personal = editorState.personalInfo;
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${personal.fullName || 'Resume'}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    @page { margin: 0; }
    body { font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #334155; line-height: 1.4; padding: 35px 45px; margin: 0; font-size: 11px; background: #fff; }
    .header { margin-bottom: 20px; }
    h1 { font-size: 28px; font-weight: 800; margin: 0 0 6px 0; color: #0f172a; letter-spacing: -0.5px; }
    .contact-info { font-size: 10.5px; color: #64748b; font-weight: 500; display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
    .contact-info a { color: #3b82f6; text-decoration: none; }
    .contact-info .divider { color: #cbd5e1; }
    h2 { font-size: 13px; font-weight: 700; margin: 16px 0 8px 0; text-transform: uppercase; color: #1e40af; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; letter-spacing: 0.5px; }
    p { margin: 6px 0; text-align: justify; color: #475569; }
    ul { margin: 6px 0 12px 0; padding-left: 18px; color: #475569; }
    li { margin-bottom: 4px; line-height: 1.5; }
    .section-row { display: flex; justify-content: space-between; margin-bottom: 4px; align-items: flex-start; }
    .item-title { font-weight: 700; color: #0f172a; font-size: 12px; }
    .item-subtitle { font-weight: 600; color: #3b82f6; font-size: 11px; margin-left: 6px; }
    .item-date { font-size: 10px; font-weight: 600; color: #64748b; white-space: nowrap; background: #f8fafc; padding: 2px 6px; border-radius: 4px; border: 1px solid #e2e8f0; }
    .skills-list { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0; }
    .skill-tag { background: #eff6ff; color: #1e40af; padding: 3px 8px; border-radius: 6px; font-size: 10.5px; font-weight: 600; border: 1px solid #bfdbfe; }
    .skills-bullet-list { margin: 2px 0 6px 0; padding-left: 18px; }
    .skills-bullet-list li { margin-bottom: 1px; line-height: 1.3; }
    .tech-stack { font-size: 10px; color: #64748b; margin-top: 2px; font-weight: 500; }
    .score-badge { font-size: 10px; color: #059669; background: #d1fae5; padding: 2px 6px; border-radius: 4px; font-weight: 600; margin-top: 4px; display: inline-block; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${personal.fullName || 'Candidate Name'}</h1>
    <div class="contact-info">
      ${personal.location ? `<span>${personal.location}</span>` : ''}
      ${personal.location && (personal.phone || personal.email || personal.linkedIn || personal.website) ? '<span class="divider">&bull;</span>' : ''}
      ${personal.phone ? `<span>${personal.phone}</span>` : ''}
      ${personal.phone && (personal.email || personal.linkedIn || personal.website) ? '<span class="divider">&bull;</span>' : ''}
      ${personal.email ? `<a href="mailto:${personal.email}">${personal.email}</a>` : ''}
      ${personal.email && (personal.linkedIn || personal.website) ? '<span class="divider">&bull;</span>' : ''}
      ${personal.linkedIn ? `<a href="${personal.linkedIn}">${personal.linkedIn.replace(/^https?:\/\//, '').replace(/\/$/, '')}</a>` : ''}
      ${personal.linkedIn && personal.website ? '<span class="divider">&bull;</span>' : ''}
      ${personal.website ? `<a href="${personal.website}">${personal.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}</a>` : ''}
    </div>
  </div>

  ${editorState.summary ? `
  <h2>Professional Summary</h2>
  <p>${editorState.summary}</p>
  ` : ''}

  ${editorState.skills?.length > 0 ? `
  <h2>Technical Skills</h2>
  <div class="skills-inline" style="margin-top: 4px; line-height: 1.5;">
    ${editorState.skills.join(', ')}
  </div>
  ` : ''}

  ${editorState.experience?.length > 0 ? `
  <h2>Professional Experience</h2>
  ${editorState.experience.map((exp: any) => `
    <div style="margin-bottom: 12px;">
      <div class="section-row">
        <div><span class="item-title">${exp.role}</span> <span class="item-subtitle">${exp.company}</span></div>
        <div class="item-date">${exp.duration}</div>
      </div>
      <ul>
        ${exp.description.split('\n').filter((l: string) => l.trim()).map((l: string) => `<li>${l.replace(/^[-•]\s*/, '')}</li>`).join('')}
      </ul>
    </div>
  `).join('')}
  ` : ''}

  ${editorState.projects?.length > 0 ? `
  <h2>Projects</h2>
  ${editorState.projects.map((proj: any) => `
    <div style="margin-bottom: 12px;">
      <div class="section-row">
        <div><span class="item-title">${proj.title}</span> ${proj.link ? `<span style="margin-left:6px; font-size:11px"><a href="${proj.link}">Link</a></span>` : ''}</div>
      </div>
      ${proj.techStack?.length ? `<div class="tech-stack">Built with: ${proj.techStack.join(', ')}</div>` : ''}
      <ul>
        ${proj.description.split('\n').filter((l: string) => l.trim()).map((l: string) => `<li>${l.replace(/^[-•]\s*/, '')}</li>`).join('')}
      </ul>
    </div>
  `).join('')}
  ` : ''}

  ${editorState.education?.length > 0 ? `
  <h2>Education</h2>
  ${editorState.education.map((edu: any) => `
    <div style="margin-bottom: 10px;">
      <div class="section-row">
        <div><span class="item-title">${edu.degree}</span> <span class="item-subtitle">${edu.institution}</span></div>
        <div class="item-date">${edu.duration}</div>
      </div>
      ${edu.details ? `<div class="score-badge">Score: ${edu.details}</div>` : ''}
    </div>
  `).join('')}
  ` : ''}
  
  ${editorState.achievements?.length ? `
  <h2>Certifications & Achievements</h2>
  <ul style="margin-bottom: 0;">
    ${editorState.achievements.map((ach: string) => `<li>${ach}</li>`).join('')}
  </ul>
  ` : ''}
</body>
</html>
    `;
  };

  const handleExportPDF = () => {
    if (!activeResume) return;
    const docHtml = generateHTMLTemplate();
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(docHtml);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
      }, 500);
      showToast('Preparing PDF. Please click Save in the print dialog.', 'info');
    }
  };

  const handleExportDOCX = () => {
    if (!activeResume) return;
    const docHtml = generateHTMLTemplate();
    const blob = new Blob(['\ufeff', docHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${editorState.personalInfo.fullName.replace(/\s+/g, '_') || 'Resume'}_ATS_Tailored.doc`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('DOCX exported successfully!', 'success');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-50 px-4 py-8 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-300">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Previous Step Back link */}
        <div className="flex items-center">
          {activeCompany ? (
            <Link
              to={`/company/${activeCompany._id}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Company Details
            </Link>
          ) : (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          )}
        </div>

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

        {/* Triple Panel Layout or Upload Prompt */}
        {(!activeResume && resumes.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl border-dashed bg-white dark:bg-zinc-900 text-center shadow-sm">
            <Upload className="h-16 w-16 text-indigo-200 dark:text-indigo-900 mb-6" />
            <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-200 mb-2">Upload your reference resume</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 max-w-md">
              To get started, please upload your core resume. We'll parse it and you can use it to generate tailored versions for any job application.
            </p>
            <label className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold cursor-pointer transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5">
              <Upload className="h-4.5 w-4.5" />
              {isUploading ? 'Parsing document...' : 'Upload PDF / DOCX Resume'}
              <input
                type="file"
                disabled={isUploading}
                accept=".pdf,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        ) : (
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
                    className={`pb-1 text-[11px] font-bold tracking-tight border-b-2 whitespace-nowrap transition-all cursor-pointer ${activeTab === sect.id
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
                          <label className="block text-[10px] uppercase font-bold text-zinc-400">Description</label>
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
              </div>
              <iframe
                className="flex-1 w-full h-[620px] border border-zinc-300 dark:border-zinc-700 rounded-xl"
                srcDoc={generateHTMLTemplate()}
                title="Resume PDF Preview"
              />
            </div>

            {/* Panel 3: Export & AI Sidebar (span 3) */}
            <div className="xl:col-span-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm flex flex-col h-fit space-y-6">

              {/* Download Actions */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase text-zinc-400">Export Resume</h3>

                <button
                  onClick={handleExportPDF}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 py-3 text-xs font-bold transition-all cursor-pointer border border-red-100 dark:border-red-900/50"
                >
                  <Download className="h-4.5 w-4.5" />
                  Download as PDF
                </button>

                <button
                  onClick={handleExportDOCX}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-400 py-3 text-xs font-bold transition-all cursor-pointer border border-blue-100 dark:border-blue-900/50"
                >
                  <FileText className="h-4.5 w-4.5" />
                  Download as DOCX
                </button>
              </div>

              {/* Master AI Rewrite trigger */}
              <div className="border-t border-zinc-150 dark:border-zinc-800 pt-5 mt-5">
                <div className="mb-4">
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-2">Target Job Context</label>
                  {activeCompany ? (
                    <div className="p-3 rounded-xl border border-purple-100 bg-purple-50/50 dark:border-purple-900/40 text-[11px]">
                      <span className="block font-bold truncate text-zinc-800 dark:text-zinc-200">{activeCompany.jobTitle}</span>
                      <span className="block text-zinc-500 truncate mt-0.5">{activeCompany.companyName}</span>
                    </div>
                  ) : (
                    <textarea
                      value={pastedJd}
                      onChange={(e) => setPastedJd(e.target.value)}
                      placeholder="Paste JD text here to tailor resume"
                      rows={2}
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 text-[11px] outline-none focus:bg-white dark:bg-zinc-950 dark:border-zinc-800"
                    />
                  )}
                </div>

                <button
                  onClick={handleTailorResume}
                  disabled={isTailoring || (!activeCompany && !pastedJd)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 disabled:opacity-40 transition-all cursor-pointer hover:shadow-indigo-500/40 hover:-translate-y-0.5"
                >
                  <Brain className={`h-4.5 w-4.5 ${isTailoring ? 'animate-spin' : 'animate-pulse'}`} />
                  {isTailoring ? 'Tailoring with Grok...' : 'AI STAR Rewrite'}
                </button>

                <p className="text-[10px] text-center text-zinc-500 mt-4 leading-relaxed">
                  Clicking this will automatically rewrite your experience bullet points to match the JD, seamlessly adding any missing keywords, closing the gap, and boosting your ATS score instantly.
                </p>
              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
};
