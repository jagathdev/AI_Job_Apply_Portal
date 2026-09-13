import React, { useEffect, useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import axios from 'axios';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  Sparkles, FileText, Upload, Brain, Eye, Save, Plus, Trash2,
  Download, CheckCircle, TrendingUp, HelpCircle, Edit, ListCheck, ArrowLeft, ArrowRight, AlertTriangle,
  RefreshCw, Layers, CheckCircle2, XCircle, ZoomIn, ZoomOut
} from 'lucide-react';

export const ResumeBuilder: React.FC = () => {
  const { showToast, activeResume, setActiveResume, activeCompany, token } = useApp();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [activeTab, setActiveTab] = useState<'info' | 'summary' | 'skills' | 'experience' | 'education' | 'projects' | 'achievements'>('info');
  const [editorState, setEditorState] = useState<any>({
    personalInfo: { fullName: '', targetRole: '', email: '', phone: '', location: '', website: '', linkedIn: '', github: '' },
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

  // Integrated ATS Scanner State
  const [loadingATS, setLoadingATS] = useState(false);
  const [atsReport, setAtsReport] = useState<any | null>(null);
  const [dismissedKeywords, setDismissedKeywords] = useState<string[]>([]);
  const hasFetchedATS = useRef(false);

  // 10-second Auto-Save state & refs
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const isInitialLoad = useRef(true);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (activeResume && activeCompany && !hasFetchedATS.current) {
      hasFetchedATS.current = true;
      runATSCheck();
    }
  }, [activeResume, activeCompany]);

  useEffect(() => {
    if (token) {
      loadUserResumes();
    }
  }, [token]);

  useEffect(() => {
    if (activeResume) {
      isInitialLoad.current = true;
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      setSaveStatus('saved');
      setEditorState({
        personalInfo: activeResume.personalInfo || { fullName: '', targetRole: '', email: '', phone: '', location: '', website: '', linkedIn: '', github: '' },
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

  // 10-second Auto-Save effect when editorState changes
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

    if (!activeResume?._id) return;

    setSaveStatus('unsaved');

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        setSaveStatus('saving');
        const res = await axios.put(`/api/resume/${activeResume._id}`, editorState);
        setActiveResume(res.data.resume);
        setResumes(prev => prev.map(r => r._id === res.data.resume._id ? res.data.resume : r));
        setSaveStatus('saved');
        showToast('Resume changes auto-saved.', 'success');
      } catch (err) {
        console.error('Auto-save error:', err);
        setSaveStatus('unsaved');
      }
    }, 5000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [editorState]);

  // Clean legacy AI data to strip "SITUATION: TASK: ACTION: RESULT:" keywords seamlessly
  useEffect(() => {
    if (activeResume && editorState.experience?.length > 0) {
      let changed = false;
      const cleanExp = editorState.experience.map((exp: any) => {
        if (exp.description && /(SITUATION|TASK|ACTION|RESULT):?\s*/i.test(exp.description)) {
          changed = true;
          return {
            ...exp,
            description: exp.description.replace(/(SITUATION|TASK|ACTION|RESULT):?\s*/gi, '').replace(/\s{2,}/g, ' ').trim()
          };
        }
        return exp;
      });
      const cleanProj = editorState.projects?.map((proj: any) => {
        if (proj.description && /(SITUATION|TASK|ACTION|RESULT):?\s*/i.test(proj.description)) {
          changed = true;
          return {
            ...proj,
            description: proj.description.replace(/(SITUATION|TASK|ACTION|RESULT):?\s*/gi, '').replace(/\s{2,}/g, ' ').trim()
          };
        }
        return proj;
      });

      if (changed) {
        setEditorState((prev: any) => ({
          ...prev,
          experience: cleanExp,
          projects: cleanProj || prev.projects
        }));
      }
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

  const handleDeleteResume = () => {
    if (!activeResume) return;
    setShowDeleteModal(true);
  };

  const confirmDeleteResume = async () => {
    if (!activeResume) return;
    try {
      await axios.delete(`/api/resume/${activeResume._id}`);
      const updatedResumes = resumes.filter(r => r._id !== activeResume._id);
      setResumes(updatedResumes);
      setActiveResume(updatedResumes[0] || null);
      showToast('Resume deleted successfully.', 'success');
      setShowDeleteModal(false);
    } catch (err) {
      showToast('Failed to delete resume.', 'error');
    }
  };

  const handleSaveEditor = async () => {
    if (!activeResume) return;
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    setSaveStatus('saving');
    try {
      const res = await axios.put(`/api/resume/${activeResume._id}`, editorState);
      setActiveResume(res.data.resume);
      setResumes(prev => prev.map(r => r._id === res.data.resume._id ? res.data.resume : r));
      setSaveStatus('saved');
      showToast('Resume changes saved successfully!', 'success');
    } catch (err) {
      setSaveStatus('unsaved');
      showToast('Failed to save changes.', 'error');
    }
  };

  // Trigger AI tailoring
  const handleTailorResume = async () => {
    if (!activeResume) return;
    setIsTailoring(true);
    try {
      showToast('Tailoring resume experiences with AI...', 'info');
      const res = await axios.post('/api/resume/tailor', {
        resumeId: activeResume._id,
        companyId: activeCompany?._id || null,
        customJdText: activeCompany ? null : pastedJd
      });

      const newTailoredResume = res.data.resume;
      setActiveResume(newTailoredResume);
      setResumes(prev => [newTailoredResume, ...prev]);
      showToast('ATS-Optimized tailored resume created!', 'success');

      // Automatically re-run ATS check to get updated ATS score instantly
      if (activeCompany && newTailoredResume?._id) {
        setLoadingATS(true);
        try {
          const atsRes = await axios.post('/api/ats/analyze', {
            resumeId: newTailoredResume._id,
            companyId: activeCompany._id
          });
          setAtsReport(atsRes.data.report || atsRes.data);
          showToast('ATS Score calculated automatically!', 'success');
        } catch (atsErr) {
          console.error('Auto ATS check error:', atsErr);
        } finally {
          setLoadingATS(false);
        }
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || 'AI tailoring timed out.', 'error');
    } finally {
      setIsTailoring(false);
    }
  };

  // Interactive field updates
  const runATSCheck = async () => {
    if (!activeResume || !activeCompany) return;
    setLoadingATS(true);
    try {
      showToast('Running deep ATS scan against target tech stack...', 'info');
      const res = await axios.post('/api/ats/analyze', {
        resumeId: activeResume._id,
        companyId: activeCompany._id
      });
      setAtsReport(res.data.report || res.data);
      showToast('ATS Compliance Report ready!', 'success');
    } catch (err) {
      showToast('Failed to run ATS comparison.', 'error');
    } finally {
      setLoadingATS(false);
    }
  };

  const handleAddKeyword = (keyword: string) => {
    const kwLower = keyword.toLowerCase().trim();
    setDismissedKeywords(prev => [...prev, kwLower]);
    setEditorState((prev: any) => {
      const currentSkills = prev.skills || [];
      if (currentSkills.some((s: string) => s.toLowerCase().trim() === kwLower)) return prev;
      return { ...prev, skills: [...currentSkills, keyword] };
    });
    setAtsReport((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        missingKeywords: (prev.missingKeywords || []).filter((k: string) => k.toLowerCase().trim() !== kwLower)
      };
    });
    showToast(`Added ${keyword} to skills!`, 'success');
  };

  const handleDismissKeyword = (keyword: string) => {
    const kwLower = keyword.toLowerCase().trim();
    setDismissedKeywords(prev => [...prev, kwLower]);
    setAtsReport((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        missingKeywords: (prev.missingKeywords || []).filter((k: string) => k.toLowerCase().trim() !== kwLower)
      };
    });
  };

  const handleApplyBullet = async (comp: any) => {
    setAtsReport((prev: any) => {
      if (!prev) return prev;
      const list = (prev.bulletPointComparisons || []).map((item: any) => {
        if (item === comp || (item.suggested && item.suggested === comp.suggested)) {
          return { ...item, applied: true };
        }
        return item;
      });
      return { ...prev, bulletPointComparisons: list };
    });

    let updatedState: any = null;

    setEditorState((prev: any) => {
      const newState = JSON.parse(JSON.stringify(prev));
      let isApplied = false;

      if (Array.isArray(newState.experience) && newState.experience.length > 0) {
        if (typeof comp.index === 'number' && newState.experience[comp.index]?.description) {
          const desc = newState.experience[comp.index].description;
          if (comp.original && desc.includes(comp.original)) {
            newState.experience[comp.index].description = desc.replace(comp.original, comp.suggested);
            isApplied = true;
          }
        }

        if (!isApplied && comp.original) {
          for (let i = 0; i < newState.experience.length; i++) {
            const desc = newState.experience[i].description || '';
            if (desc.includes(comp.original)) {
              newState.experience[i].description = desc.replace(comp.original, comp.suggested);
              isApplied = true;
              break;
            }
          }
        }

        if (!isApplied && comp.original) {
          const words = comp.original.split(/\s+/).slice(0, 5).join(' ');
          if (words && words.length > 10) {
            for (let i = 0; i < newState.experience.length; i++) {
              const desc = newState.experience[i].description || '';
              if (desc.includes(words)) {
                newState.experience[i].description = desc + '\n• ' + comp.suggested;
                isApplied = true;
                break;
              }
            }
          }
        }

        if (!isApplied && newState.experience[0]) {
          const desc = newState.experience[0].description || '';
          newState.experience[0].description = desc ? `${desc}\n• ${comp.suggested}` : comp.suggested;
          isApplied = true;
        }
      } else if (Array.isArray(newState.projects) && newState.projects.length > 0) {
        const desc = newState.projects[0].description || '';
        newState.projects[0].description = desc ? `${desc}\n• ${comp.suggested}` : comp.suggested;
        isApplied = true;
      }

      updatedState = newState;
      return newState;
    });

    if (activeResume && updatedState) {
      try {
        setSaveStatus('saving');
        const res = await axios.put(`/api/resume/${activeResume._id}`, updatedState);
        setActiveResume(res.data.resume);
        setSaveStatus('saved');
        showToast('AI phrasing adopted & saved to resume!', 'success');
      } catch (err) {
        showToast('AI phrasing adopted into resume!', 'success');
      }
    } else {
      showToast('AI phrasing adopted into resume!', 'success');
    }
  };

  const updatePersonalInfo = (field: string, value: string) => {
    setEditorState((prev: any) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value }
    }));
  };

  const addArrayItem = (field: 'experience' | 'education' | 'projects', template: any) => {
    let newIndex = 0;
    setEditorState((prev: any) => {
      const arr = prev[field] || [];
      newIndex = arr.length;
      return {
        ...prev,
        [field]: [...arr, template]
      };
    });

    setTimeout(() => {
      const targetId = `${field}-input-${newIndex}`;
      const inputEl = document.getElementById(targetId) as HTMLInputElement;
      if (inputEl) {
        inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        inputEl.focus();
        inputEl.select();
      } else {
        const blockEl = document.getElementById(`${field}-block-${newIndex}`);
        if (blockEl) {
          blockEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const firstInput = blockEl.querySelector('input') as HTMLInputElement;
          if (firstInput) {
            firstInput.focus();
            firstInput.select();
          }
        }
      }
    }, 120);
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

  const makeUrl = (url: string) => {
    if (!url) return '';
    return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
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
    html { background: #e4e4e7; padding: 20px; min-height: 100vh; overflow: auto; }
    body { 
      font-family: 'Inter', system-ui, -apple-system, sans-serif; 
      color: #374151; 
      line-height: 1.5; 
      margin: 0 auto; 
      font-size: 13px;
      background: transparent;
      overflow: hidden;
    }
    #scale-wrapper {
      width: 800px;
      transform-origin: top left;
    }
    .page {
      width: 800px;
      height: 1123px;
      background: #fff;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      margin-bottom: 20px;
      box-sizing: border-box;
      overflow: hidden;
      position: relative;
    }
    .page-content {
      padding: 35px 45px;
      box-sizing: border-box;
    }
    @media print {
      @page { margin: 0; size: A4; }
      html { background: #fff !important; padding: 0 !important; display: block !important; overflow: visible !important; }
      body { transform: none !important; zoom: 1 !important; width: 100% !important; margin: 0 !important; }
      .page { margin-bottom: 0 !important; box-shadow: none !important; border: none !important; page-break-after: always; height: 1123px !important; }
      .page:last-child { page-break-after: auto; }
      .page-content { padding: 35px 45px !important; }
    }
    .header { margin-bottom: 20px; text-align: center; }
    h1 { font-size: 28px; font-weight: 800; margin: 0 0 6px 0; color: #111827; letter-spacing: normal; }
    .contact-info { font-size: 12px; color: #6b7280; font-weight: 500; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: center; }
    .contact-info a { color: #2563eb; text-decoration: none; }
    .contact-info .divider { color: #9ca3af; margin: 0 4px; }
    h2 { font-size: 14px; font-weight: 700; margin: 18px 0 8px 0; text-transform: uppercase; color: #111827; border-bottom: 1.5px solid #e5e7eb; padding-bottom: 4px; letter-spacing: 0.5px; }
    p { margin: 6px 0; text-align: left; color: #374151; overflow-wrap: break-word; line-height: 1.6; letter-spacing: normal; word-spacing: normal; }
    ul { margin: 6px 0 12px 0; padding-left: 20px; color: #374151; }
    li { margin-bottom: 4px; line-height: 1.5; letter-spacing: normal; word-spacing: normal; }
    a { color: #2563eb; text-decoration: none; }
    .section-row { display: flex; justify-content: space-between; margin-bottom: 4px; align-items: flex-start; gap: 12px; }
    .item-title { font-weight: 700; color: #111827; font-size: 14px; letter-spacing: normal; }
    .item-subtitle { font-weight: 600; color: #4b5563; font-size: 12px; letter-spacing: normal; }
    .item-date { font-size: 11px; font-weight: 600; color: #6b7280; white-space: nowrap; padding: 2px 0px; letter-spacing: normal; }
    .skills-list { display: flex; flex-wrap: wrap; gap: 6px 14px; margin: 8px 0; }
    .skill-tag { color: #374151; font-size: 12px; font-weight: 600; display: inline-block; background: transparent; padding: 0; border-radius: 0; letter-spacing: normal; }
    .skills-bullet-list { margin: 2px 0 6px 0; padding-left: 20px; }
    .skills-bullet-list li { margin-bottom: 2px; line-height: 1.4; }
    .tech-stack { font-size: 11px; color: #6b7280; margin-top: 2px; font-weight: 500; letter-spacing: normal; }
    .score-badge { font-size: 11px; color: #2563eb; font-weight: 600; margin-top: 4px; display: inline-block; }
  </style>
  <script>
    function paginate() {
      const wrapper = document.getElementById('scale-wrapper');
      if (!wrapper) return;
      const elements = Array.from(wrapper.children).filter(el => {
        const tag = el.tagName.toLowerCase();
        return tag !== 'script' && tag !== 'style' && !el.classList.contains('page');
      });
      if (elements.length === 0) return;
      
      elements.forEach(el => el.remove());
      
      let currentPage = createPage();
      wrapper.appendChild(currentPage);
      
      const MAX_CONTENT_HEIGHT = 1123;
      
      for (const el of elements) {
        const contentDiv = currentPage.querySelector('.page-content');
        contentDiv.appendChild(el);
        
        if (contentDiv.offsetHeight > MAX_CONTENT_HEIGHT && contentDiv.children.length > 1) {
          contentDiv.removeChild(el);
          
          let prev = contentDiv.lastElementChild;
          let movedHeading = null;
          if (prev && prev.tagName.match(/^H[1-6]$/)) {
            movedHeading = prev;
            contentDiv.removeChild(prev);
          }
          
          currentPage = createPage();
          wrapper.appendChild(currentPage);
          const newContent = currentPage.querySelector('.page-content');
          if (movedHeading) newContent.appendChild(movedHeading);
          newContent.appendChild(el);
        }
      }
    }

    function createPage() {
      const page = document.createElement('div');
      page.className = 'page';
      const content = document.createElement('div');
      content.className = 'page-content';
      page.appendChild(content);
      return page;
    }

    function adjustScale() {
      try {
        paginate();
        const iframeWidth = window.innerWidth;
        if (iframeWidth > 0) {
          const wrapper = document.getElementById('scale-wrapper');
          if (!wrapper) return;
          const baseScale = Math.min((iframeWidth - 40) / 800, 1);
          const scale = baseScale * ${previewZoom};
          wrapper.style.transform = 'scale(' + scale + ')';
          
          const numPages = wrapper.querySelectorAll('.page').length;
          const totalHeight = numPages * 1143;
          
          document.body.style.width = (800 * scale) + 'px';
          document.body.style.height = (totalHeight * scale) + 'px';
        }
      } catch (e) {
      }
    }
    window.addEventListener('resize', adjustScale);
    window.addEventListener('DOMContentLoaded', adjustScale);
  </script>
</head>
<body>
  <div id="scale-wrapper">
    <div class="header">
    <h2>${personal.fullName || 'Candidate Name'}</h2>
    ${personal.targetRole ? `<div style="font-size: 16px; font-weight: 700; color: #2563eb; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">${personal.targetRole}</div>` : (activeCompany?.jobTitle ? `<div style="font-size: 16px; font-weight: 700; color: #2563eb; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">${activeCompany.jobTitle}</div>` : '')}
    <div class="contact-info">
      ${personal.location ? `<span>${personal.location}</span>` : ''}
      ${personal.location && (personal.phone || personal.email || personal.linkedIn || personal.github || personal.website) ? ' <span class="divider">•</span> ' : ''}
      ${personal.phone ? `<span>${personal.phone}</span>` : ''}
      ${personal.phone && (personal.email || personal.linkedIn || personal.github || personal.website) ? ' <span class="divider">•</span> ' : ''}
      ${personal.email ? `<a href="mailto:${personal.email}">${personal.email}</a>` : ''}
      ${personal.email && (personal.linkedIn || personal.github || personal.website) ? ' <span class="divider">•</span> ' : ''}
      ${personal.linkedIn ? `<a href="${makeUrl(personal.linkedIn)}">${personal.linkedIn.replace(/^https?:\/\//, '').replace(/\/$/, '')}</a>` : ''}
      ${personal.linkedIn && (personal.github || personal.website) ? ' <span class="divider">•</span> ' : ''}
      ${personal.github ? `<a href="${makeUrl(personal.github)}">${personal.github.replace(/^https?:\/\/(www\.)?github\.com\//, '').replace(/\/$/, '')}</a>` : ''}
      ${personal.github && personal.website ? ' <span class="divider">•</span> ' : ''}
      ${personal.website ? `<a href="${makeUrl(personal.website)}">${personal.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}</a>` : ''}
    </div>
  </div>

  ${editorState.summary ? `
  <h2>Professional Summary</h2>
  <p>${editorState.summary}</p>
  ` : ''}

  ${editorState.skills?.length > 0 ? `
  <h2>Technical Skills</h2>
  <div class="skills-list">
    ${editorState.skills.map((s: string) => `<span class="skill-tag">${s}</span>`).join(' <span style="color:#9ca3af; font-weight:400">•</span> ')}
  </div>
  ` : ''}

  ${editorState.experience?.length > 0 ? `
  <h2>Professional Experience</h2>
  ${editorState.experience.map((exp: any) => `
    <div style="margin-bottom: 12px;">
      <div class="section-row">
        <div><span class="item-title">${exp.role}</span>${exp.company ? ` &nbsp;•&nbsp; <span class="item-subtitle">${exp.company}</span>` : ''}</div>
        <div class="item-date">${exp.duration || ''}</div>
      </div>
      <ul>
        ${exp.description ? exp.description.split('\n').filter((l: string) => l.trim()).map((l: string) => `<li>${l.replace(/^[-•*]\s*/, '').trim()}</li>`).join('') : ''}
      </ul>
    </div>
  `).join('')}
  ` : ''}

  ${editorState.projects?.length > 0 ? `
  <h2>Projects</h2>
  ${editorState.projects.map((proj: any) => `
    <div style="margin-bottom: 12px;">
      <div class="section-row">
        <div><span class="item-title">${proj.title}</span>${proj.link ? `<span style="margin-left:6px; font-size:11px"><a href="${makeUrl(proj.link)}">Live Demo</a></span>` : ''}</div>
      </div>
      ${proj.techStack?.length ? `<div class="tech-stack">Built with: ${proj.techStack.join(', ')}</div>` : ''}
      <ul>
        ${proj.description ? proj.description.split('\n').filter((l: string) => l.trim()).map((l: string) => `<li>${l.replace(/^[-•*]\s*/, '').trim()}</li>`).join('') : ''}
      </ul>
    </div>
  `).join('')}
  ` : ''}

  ${editorState.education?.length > 0 ? `
  <h2>Education</h2>
  ${editorState.education.map((edu: any) => `
    <div style="margin-bottom: 10px;">
      <div class="section-row">
        <div><span class="item-title">${edu.degree}</span>${edu.institution ? ` &nbsp;•&nbsp; <span class="item-subtitle">${edu.institution}</span>` : ''}</div>
        <div class="item-date">${edu.duration || ''}</div>
      </div>
      ${edu.details ? `<div class="score-badge">${edu.details.replace(/^Score:\s*/i, '')}</div>` : ''}
    </div>
  `).join('')}
  ` : ''}
  
  ${editorState.achievements?.length ? `
  <h2>Certifications & Achievements</h2>
  <ul style="margin-bottom: 0;">
    ${editorState.achievements.map((ach: string) => `<li>${ach.replace(/^[-•*]\s*/, '').trim()}</li>`).join('')}
  </ul>
  ` : ''}
  </div>
</body>
</html>
    `;
  };

  const handleExportPDF = () => {
    if (!activeResume) return;
    executePDFExport();
  };

  const executePDFExport = () => {
    showToast('Generating ATS-Friendly PDF...', 'info');
    const docHtml = generateHTMLTemplate();
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '800px';
    iframe.style.height = '1123px';
    iframe.style.left = '-9999px';
    iframe.style.top = '0';
    iframe.style.opacity = '0.01';
    iframe.style.zIndex = '-9999';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(docHtml);
      doc.close();

      setTimeout(async () => {
        let pageElements = Array.from(doc.querySelectorAll('.page')) as HTMLElement[];
        if (pageElements.length === 0) {
          const wrapper = doc.getElementById('scale-wrapper') as HTMLElement;
          if (wrapper) pageElements = [wrapper];
        }

        if (pageElements.length === 0) return;

        try {
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'pt',
            format: 'a4'
          });

          const pdfWidth = pdf.internal.pageSize.getWidth(); // 595.28 pt
          const pdfHeight = pdf.internal.pageSize.getHeight(); // 841.89 pt

          for (let i = 0; i < pageElements.length; i++) {
            const el = pageElements[i];

            if (i > 0) {
              pdf.addPage();
            }

            // 1. Crisp high-res visual render retaining exact badges, colors, fonts, skill tags, and layout
            const canvas = await html2canvas(el, {
              scale: 2.5,
              useCORS: true,
              logging: false,
              backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.98);
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

            // 2. Selectable & Copyable Text Layer (Vector text for ATS & copy-paste)
            const elementRect = el.getBoundingClientRect();
            const walker = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);

            let node: Node | null;
            while ((node = walker.nextNode())) {
              const rawText = node.textContent;
              if (!rawText || !rawText.trim()) continue;

              const parent = node.parentElement;
              if (!parent) continue;

              const computedStyle = window.getComputedStyle(parent);
              const fontSizePx = parseFloat(computedStyle.fontSize || '12');
              const fontSizePt = fontSizePx * (pdfHeight / elementRect.height);
              const isBold = computedStyle.fontWeight === 'bold' || parseInt(computedStyle.fontWeight, 10) >= 600;

              pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
              pdf.setFontSize(Math.max(fontSizePt, 6));

              // Measure word positions to prevent text collision / compressed selections
              const words = rawText.split(/(\s+)/);
              let charOffset = 0;

              for (let w = 0; w < words.length; w++) {
                const word = words[w];
                if (!word) continue;

                if (word.trim()) {
                  try {
                    const range = doc.createRange();
                    range.setStart(node, charOffset);
                    range.setEnd(node, charOffset + word.length);
                    const rect = range.getBoundingClientRect();

                    if (rect.width > 0 && rect.height > 0) {
                      const x = (rect.left - elementRect.left) * (pdfWidth / elementRect.width);
                      const y = (rect.top - elementRect.top) * (pdfHeight / elementRect.height) + (fontSizePt * 0.82);

                      pdf.text(word, x, y, { renderingMode: 'invisible' as any });
                    }
                  } catch (e) {
                    // Fallback if range selection fails
                  }
                }
                charOffset += word.length;
              }
            }

            // 3. Make links clickable on this page
            const links = el.querySelectorAll('a');
            links.forEach(link => {
              const rect = link.getBoundingClientRect();
              if (elementRect.width > 0 && elementRect.height > 0) {
                const x = (rect.left - elementRect.left) * (pdfWidth / elementRect.width);
                const y = (rect.top - elementRect.top) * (pdfHeight / elementRect.height);
                const w = rect.width * (pdfWidth / elementRect.width);
                const h = rect.height * (pdfHeight / elementRect.height);

                const url = link.getAttribute('href');
                if (url) {
                  pdf.link(x, y, w, h, { url });
                }
              }
            });
          }

          const roleName = editorState.personalInfo?.targetRole || activeCompany?.jobTitle || '';
          const candidateName = editorState.personalInfo?.fullName || 'Candidate';
          const nameParts = [candidateName, roleName, 'ATS'].filter(Boolean);
          const formattedFilename = nameParts.join('_').replace(/[\s\W]+/g, '_');

          pdf.save(`${formattedFilename}.pdf`);

          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
          showToast('Resume downloaded successfully!', 'success');
        } catch (error) {
          console.error("PDF generation error:", error);
          showToast('Error generating PDF', 'error');
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }
      }, 1000);
    }
  };

  const handleExportDOCX = () => {
    if (!activeResume) return;
    const docHtml = generateHTMLTemplate();
    const blob = new Blob(['\ufeff', docHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const roleName = editorState.personalInfo?.targetRole || activeCompany?.jobTitle || '';
    const candidateName = editorState.personalInfo?.fullName || 'Candidate';
    const nameParts = [candidateName, roleName, 'ATS'].filter(Boolean);
    const formattedFilename = nameParts.join('_').replace(/[\s\W]+/g, '_');

    link.download = `${formattedFilename}.doc`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('DOCX exported successfully!', 'success');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-50 px-4 py-8 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-300">
      <div className="mx-auto max-w-7xl space-y-6">



        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Interactive AI Resume Suite</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Select or upload a resume, tailor bullet points using AI, edit sections, and export as PDF.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3.5">
            {/* Quick selectors */}
            {resumes.length > 0 && (
              <div className="flex items-center gap-2">
                <select
                  value={activeResume?._id || ''}
                  onChange={(e) => {
                    const selected = resumes.find(r => r._id === e.target.value);
                    if (selected) setActiveResume(selected);
                  }}
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-900 w-48 md:w-64 truncate"
                >
                  {resumes.map((r, i) => {
                    let displayName = r.name || 'Resume';
                    // Clean up multiple duplicate tags that may exist in older database entries
                    displayName = displayName.replace(/(\s*\(ATS Tailored\)){2,}/g, ' (ATS Tailored)');
                    if (displayName.length > 35) {
                      displayName = displayName.substring(0, 32) + '...';
                    }
                    return (
                      <option key={r._id} value={r._id}>
                        {displayName} {i === 0 ? '(Latest)' : ''}
                      </option>
                    );
                  })}
                </select>
                <button
                  onClick={handleDeleteResume}
                  title="Delete Resume"
                  className="p-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/20 transition-all cursor-pointer"
                >
                  <Trash2 className="h-4.5 w-4.5" />
                </button>
              </div>
            )}

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
            <div className="flex flex-wrap items-center justify-center gap-3.5 mb-8 max-w-md">
              <label className="flex items-center justify-center gap-1.5 px-6 py-3 w-48 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold cursor-pointer transition-all shadow-md shadow-indigo-500/10">
                <Upload className="h-5 w-5" />
                {isUploading ? 'Parsing...' : 'Upload File'}
                <input
                  type="file"
                  disabled={isUploading}
                  accept=".pdf,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <button
                onClick={handleManualCreate}
                className="flex items-center justify-center gap-1.5 px-6 py-3 w-48 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-bold cursor-pointer transition-all"
              >
                <FileText className="h-5 w-5" />
                Quick Draft
              </button>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 max-w-md">
              To get started, please upload your core resume. We'll parse it and you can use it to generate tailored versions for any job application.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Panel 1: Document Section Editors (span 4) */}
            <div className="lg:col-span-4 xl:col-span-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-6">

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
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-950 focus:bg-white dark:focus:bg-zinc-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Target Role / Job Title</label>
                      <input
                        type="text"
                        value={editorState.personalInfo.targetRole || activeCompany?.jobTitle || ''}
                        onChange={(e) => updatePersonalInfo('targetRole', e.target.value)}
                        placeholder="e.g. Full-Stack Engineer"
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-950 focus:bg-white dark:focus:bg-zinc-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Email</label>
                      <input
                        type="email"
                        value={editorState.personalInfo.email}
                        onChange={(e) => updatePersonalInfo('email', e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-950 focus:bg-white dark:focus:bg-zinc-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Phone</label>
                      <input
                        type="text"
                        value={editorState.personalInfo.phone}
                        onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-950 focus:bg-white dark:focus:bg-zinc-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Location</label>
                      <input
                        type="text"
                        value={editorState.personalInfo.location}
                        onChange={(e) => updatePersonalInfo('location', e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-950 focus:bg-white dark:focus:bg-zinc-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">LinkedIn</label>
                      <input
                        type="text"
                        value={editorState.personalInfo.linkedIn}
                        onChange={(e) => updatePersonalInfo('linkedIn', e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-950 focus:bg-white dark:focus:bg-zinc-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">GitHub</label>
                      <input
                        type="text"
                        value={editorState.personalInfo.github || ''}
                        onChange={(e) => updatePersonalInfo('github', e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-950 focus:bg-white dark:focus:bg-zinc-900"
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
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-950 focus:bg-white dark:focus:bg-zinc-900 leading-relaxed scrollbar-hide"
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
                      className="w-full py-3 rounded-xl border border-dashed border-indigo-300 dark:border-indigo-700/60 bg-indigo-50/40 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white hover:border-indigo-600 dark:hover:border-indigo-600 text-xs font-bold shadow-xs hover:shadow-md hover:shadow-indigo-500/20 transition-all duration-200 cursor-pointer active:scale-[0.99]"
                    >
                      + Add Experience Block
                    </button>

                    {editorState.experience?.map((exp: any, idx: number) => (
                      <div key={idx} id={`experience-block-${idx}`} className="p-4 rounded-xl border border-zinc-150 bg-zinc-50/40 dark:border-zinc-800 dark:bg-zinc-950/40 space-y-3.5 relative transition-all">
                        <button
                          onClick={() => removeArrayItem('experience', idx)}
                          className="absolute top-3.5 right-3.5 text-zinc-400 hover:text-red-500 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                        <div className="grid grid-cols-2 gap-3.5">
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-zinc-400">Company</label>
                            <input
                              type="text"
                              id={`experience-input-${idx}`}
                              value={exp.company}
                              onChange={(e) => updateArrayItem('experience', idx, 'company', e.target.value)}
                              className="w-full border-b border-zinc-200 dark:border-zinc-800 bg-transparent py-1 text-xs outline-none focus:border-indigo-500 transition-colors"
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
                            className="w-full border border-zinc-200 bg-transparent p-2.5 text-[11px] outline-none rounded-xl scrollbar-hide"
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
                      className="w-full py-3 rounded-xl border border-dashed border-indigo-300 dark:border-indigo-700/60 bg-indigo-50/40 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white hover:border-indigo-600 dark:hover:border-indigo-600 text-xs font-bold shadow-xs hover:shadow-md hover:shadow-indigo-500/20 transition-all duration-200 cursor-pointer active:scale-[0.99]"
                    >
                      + Add Academic Block
                    </button>

                    {editorState.education?.map((edu: any, idx: number) => (
                      <div key={idx} id={`education-block-${idx}`} className="p-4 rounded-xl border border-zinc-150 bg-zinc-50/40 dark:border-zinc-800 dark:bg-zinc-950/40 space-y-3.5 relative transition-all">
                        <button
                          onClick={() => removeArrayItem('education', idx)}
                          className="absolute top-3.5 right-3.5 text-zinc-400 hover:text-red-500 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                        <div>
                          <label className="block text-[10px] uppercase font-bold text-zinc-400">Institution</label>
                          <input
                            type="text"
                            id={`education-input-${idx}`}
                            value={edu.institution}
                            onChange={(e) => updateArrayItem('education', idx, 'institution', e.target.value)}
                            className="w-full border-b border-zinc-200 dark:border-zinc-800 bg-transparent py-1 text-xs outline-none focus:border-indigo-500 transition-colors"
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
                      className="w-full py-3 rounded-xl border border-dashed border-indigo-300 dark:border-indigo-700/60 bg-indigo-50/40 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white hover:border-indigo-600 dark:hover:border-indigo-600 text-xs font-bold shadow-xs hover:shadow-md hover:shadow-indigo-500/20 transition-all duration-200 cursor-pointer active:scale-[0.99]"
                    >
                      + Add Project Block
                    </button>

                    {editorState.projects?.map((proj: any, idx: number) => (
                      <div key={idx} id={`projects-block-${idx}`} className="p-4 rounded-xl border border-zinc-150 bg-zinc-50/40 dark:border-zinc-800 dark:bg-zinc-950/40 space-y-3.5 relative transition-all">
                        <button
                          onClick={() => removeArrayItem('projects', idx)}
                          className="absolute top-3.5 right-3.5 text-zinc-400 hover:text-red-500 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                        <div>
                          <label className="block text-[10px] uppercase font-bold text-zinc-400">Project Title</label>
                          <input
                            type="text"
                            id={`projects-input-${idx}`}
                            value={proj.title}
                            onChange={(e) => updateArrayItem('projects', idx, 'title', e.target.value)}
                            className="w-full border-b border-zinc-200 dark:border-zinc-800 bg-transparent py-1 text-xs outline-none focus:border-indigo-500 transition-colors"
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
                            className="w-full border border-zinc-200 bg-transparent p-2.5 text-[11px] outline-none rounded-xl scrollbar-hide"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>

              {/* Quick Action bar to save editors to database */}
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end">
                <button
                  onClick={handleSaveEditor}
                  disabled={saveStatus === 'saving'}
                  className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  Save Now
                </button>
              </div>

            </div>

            {/* Panel 2: Real-time Live Document Preview (span 5) */}
            <div className="lg:col-span-5 xl:col-span-5 rounded-2xl border border-zinc-200 bg-zinc-200/50 p-5 dark:border-zinc-900 dark:bg-zinc-950/40 shadow-sm flex flex-col">

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 mb-4 border-b border-zinc-300 dark:border-zinc-800">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 shrink-0">
                    <Eye className="h-4.5 w-4.5" />
                    <span className="hidden xs:inline sm:inline">Interactive Document Preview</span>
                    <span className="inline xs:hidden sm:hidden">Document Preview</span>
                  </span>
                  <div className="flex items-center shrink-0">
                    {saveStatus === 'saving' && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/80 leading-none animate-pulse">
                        <RefreshCw className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin shrink-0" />
                        <span className="leading-none">Saving changes...</span>
                      </span>
                    )}
                    {saveStatus === 'unsaved' && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 leading-none">
                        <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping shrink-0" />
                        <span className="leading-none">Auto-saving in 5s...</span>
                      </span>
                    )}
                    {saveStatus === 'saved' && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 leading-none">
                        <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 text-emerald-500 dark:text-emerald-400" />
                        <span className="leading-none">All changes saved</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 shrink-0">
                  <button onClick={() => setPreviewZoom(Math.max(0.5, previewZoom - 0.25))} className="p-1.5 rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 hover:bg-zinc-100 text-zinc-500 cursor-pointer">
                    <ZoomOut className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-[10px] font-bold text-zinc-500 w-8 text-center">{Math.round(previewZoom * 100)}%</span>
                  <button onClick={() => setPreviewZoom(Math.min(2.5, previewZoom + 0.25))} className="p-1.5 rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 hover:bg-zinc-100 text-zinc-500 cursor-pointer">
                    <ZoomIn className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="relative w-full h-[600px] lg:h-[800px] rounded-xl overflow-hidden shadow-sm">
                {isUploading && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-zinc-300 dark:border-zinc-700 rounded-xl">
                    <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin mb-4" />
                    <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300 animate-pulse">Your resume is parsing, please wait...</p>
                  </div>
                )}
                <iframe
                  className="w-full h-full border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-200"
                  srcDoc={generateHTMLTemplate()}
                  title="Resume PDF Preview"
                />
              </div>
            </div>

            {/* Panel 3: Export & AI Sidebar (span 3) */}
            <div className="lg:col-span-3 xl:col-span-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm flex flex-col h-fit space-y-6">


              <div className="border-t border-zinc-150 dark:border-zinc-800 pt-5 mt-5">
                <div className="mb-4">
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-2">Target Job Context</label>
                  {activeCompany ? (
                    <div className="p-3 rounded-xl border border-purple-100 bg-purple-50/50 dark:border-purple-900/40 dark:bg-purple-900/20 text-[11px]">
                      <span className="block font-bold truncate text-zinc-800 dark:text-zinc-200">{activeCompany.jobTitle}</span>
                      <span className="block text-zinc-600 dark:text-zinc-300 truncate mt-0.5">{activeCompany.companyName}</span>
                    </div>
                  ) : (
                    <textarea
                      value={pastedJd}
                      onChange={(e) => setPastedJd(e.target.value)}
                      placeholder="Paste JD text here to tailor resume"
                      rows={2}
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 text-xs outline-none focus:bg-white dark:focus:bg-zinc-900 dark:bg-zinc-950 dark:border-zinc-800 transition-colors"
                    />
                  )}
                </div>

                {(() => {
                  const isAlreadyTailored = (() => {
                    if (!activeResume) return false;

                    // 1. Explicit match by targetCompanyId
                    if (activeResume.targetCompanyId && activeCompany?._id) {
                      return String(activeResume.targetCompanyId) === String(activeCompany._id);
                    }

                    // 2. Explicit match by targetCompanyName
                    if (activeResume.targetCompanyName && activeCompany?.companyName) {
                      return activeResume.targetCompanyName.toLowerCase().trim() === activeCompany.companyName.toLowerCase().trim();
                    }

                    // 3. Fallback match by activeCompany name or slug in resume name
                    if (activeCompany?.companyName) {
                      const cNamePlain = activeCompany.companyName.toLowerCase().trim();
                      const cNameSlug = cNamePlain.replace(/\s+/g, '_');
                      const rNameLower = (activeResume.name || '').toLowerCase();

                      const matchesCompany = rNameLower.includes(cNamePlain) || rNameLower.includes(cNameSlug);
                      const isAtsTagged = rNameLower.includes('ats') || rNameLower.includes('tailored');
                      return matchesCompany && isAtsTagged;
                    }

                    // 4. If no active company, check generic ATS tag on resume name
                    return activeResume.name?.toLowerCase().includes('ats') || activeResume.name?.toLowerCase().includes('tailored');
                  })();
                  return (
                    <button
                      onClick={handleTailorResume}
                      disabled={isTailoring || isAlreadyTailored || (!activeCompany && !pastedJd)}
                      className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition-all ${isAlreadyTailored
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 cursor-not-allowed opacity-80'
                        : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-400 text-white shadow-lg shadow-indigo-500/20 disabled:opacity-40 cursor-pointer hover:shadow-indigo-500/40 hover:-translate-y-0.5'
                        }`}
                    >
                      {isTailoring ? (
                        <>
                          <Brain className="h-4.5 w-4.5 animate-spin" />
                          Tailoring with AI...
                        </>
                      ) : isAlreadyTailored ? (
                        <>
                          <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                          ATS Keywords Added ✓
                        </>
                      ) : (
                        <>
                          <Brain className="h-4.5 w-4.5 animate-pulse" />
                          Add ATS Keywords
                        </>
                      )}
                    </button>
                  );
                })()}

                <p className="text-[10px] text-center text-zinc-500 mt-4 leading-relaxed">
                  Clicking this will automatically rewrite your experience bullet points to match the JD, seamlessly adding any missing keywords, closing the gap, and boosting your ATS score instantly.
                </p>

                {/* ATS Scanner Button (Moved to Sidebar) */}
                <button
                  onClick={runATSCheck}
                  disabled={loadingATS || (!activeCompany)}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900/50 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-400 py-3 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${loadingATS ? 'animate-spin' : ''}`} />
                  {loadingATS ? 'Scanning ATS...' : 'Check ATS Score'}
                </button>

                {/* Sidebar Missing Keywords */}
                {atsReport && (() => {
                  const fullText = [
                    editorState.summary || '',
                    ...(editorState.skills || []),
                    ...(editorState.experience || []).map((e: any) => `${e.role || ''} ${e.company || ''} ${e.description || ''}`),
                    ...(editorState.projects || []).map((p: any) => `${p.title || ''} ${p.description || ''} ${(p.techStack || []).join(' ')}`)
                  ].join(' ').toLowerCase();

                  const filteredMissingKeywords = (atsReport.missingKeywords || []).filter((kw: string) => {
                    const kwLower = kw.toLowerCase().trim();
                    if (dismissedKeywords.includes(kwLower)) return false;
                    if (fullText.includes(kwLower)) return false;
                    return true;
                  });

                  return (
                    <div className="mt-6 border-t border-zinc-150 dark:border-zinc-800 pt-5 space-y-4">
                      <h3 className="text-[11px] uppercase font-bold text-red-500 flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4" />
                        Missing Critical Keywords
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {filteredMissingKeywords.map((kw: string, i: number) => (
                          <div key={i} className="flex items-center rounded-lg bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-100 dark:border-red-950/30 overflow-hidden group">
                            <span className="text-[10px] font-semibold px-2 py-1">
                              {kw}
                            </span>
                            <div className="flex items-center border-l border-red-200 dark:border-red-900/50">
                              <button onClick={() => handleAddKeyword(kw)} className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 transition-colors cursor-pointer" title="Add to Skills">
                                <CheckCircle2 className="h-3 w-3" />
                              </button>
                              <button onClick={() => handleDismissKeyword(kw)} className="p-1 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-500 transition-colors cursor-pointer" title="Dismiss">
                                <XCircle className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                        {filteredMissingKeywords.length === 0 && (
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> All critical keywords added!
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

            </div>

          </div>
        )}

        {/* ATS Score Integration Section */}
        {activeResume && activeCompany && (
          <div className="mt-12 space-y-6 border-t border-zinc-200 dark:border-zinc-800 pt-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
              <div>
                <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-600 animate-pulse" />
                  Live ATS Scanner
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Optimize your resume against <b>{activeCompany.jobTitle}</b>
                </p>
              </div>
            </div>

            {atsReport && (
              <div className="space-y-8">
                {/* Bento Grid Stats row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* ATS Score card */}
                  <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 text-center space-y-2">
                    <span className="text-[10px] uppercase font-bold text-zinc-400">ATS Compliance</span>
                    <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400">{atsReport.overallScore}/100</div>
                    <div className="h-2 bg-zinc-100 rounded-full overflow-hidden dark:bg-zinc-800">
                      <div className="h-full bg-indigo-600" style={{ width: `${atsReport.overallScore}%` }} />
                    </div>
                    <p className="text-[10px] text-zinc-400">Target threshold: 75% for enterprise ATS parsers.</p>
                  </div>

                  {/* Keyword Match card */}
                  <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 text-center space-y-2">
                    <span className="text-[10px] uppercase font-bold text-zinc-400">Keyword Density</span>
                    <div className="text-4xl font-black text-purple-600 dark:text-purple-400">{atsReport.keywordMatchScore}%</div>
                    <div className="h-2 bg-zinc-100 rounded-full overflow-hidden dark:bg-zinc-800">
                      <div className="h-full bg-purple-600" style={{ width: `${atsReport.keywordMatchScore}%` }} />
                    </div>
                    <p className="text-[10px] text-zinc-400">Density of target stack tools parsed.</p>
                  </div>

                  {/* Resume rating card */}
                  <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 text-center space-y-3 flex flex-col justify-center">
                    <span className="text-[10px] uppercase font-bold text-zinc-400">AI Evaluation</span>
                    <span className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-sm font-black tracking-tight uppercase">
                      {atsReport.overallScore >= 80 ? 'EXCELLENT' : atsReport.overallScore >= 60 ? 'GOOD' : 'NEEDS IMPROVEMENT'}
                    </span>
                  </div>
                </div>

                {/* Keyword gaps & suggestions */}
                <div className="grid grid-cols-1 gap-6">

                  {/* Suggestions */}
                  <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
                    <h3 className="text-sm font-bold text-zinc-500 uppercase flex items-center gap-1.5">
                      <Layers className="h-4.5 w-4.5 text-indigo-500" />
                      SaaS Advisor Suggestions
                    </h3>
                    <ul className="space-y-3 text-xs text-zinc-600 dark:text-zinc-300">
                      {atsReport.suggestions?.map((sug: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 leading-relaxed">
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                          {sug}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Side-by-side Experience bullet points rewrites comparison */}
                {atsReport.bulletPointComparisons?.length > 0 && (() => {
                  const fullResumeText = [
                    editorState.summary || '',
                    ...(editorState.experience || []).map((e: any) => `${e.role || ''} ${e.company || ''} ${e.description || ''}`),
                    ...(editorState.projects || []).map((p: any) => `${p.title || ''} ${p.description || ''} ${(p.techStack || []).join(' ')}`)
                  ].join(' ').toLowerCase().replace(/\s+/g, ' ');

                  return (
                    <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 space-y-6">
                      <div>
                        <h3 className="text-base font-bold">STAR-Method Experience Comparison</h3>
                        <p className="text-xs text-zinc-400 mt-1">Review original experience phrasings vs. AI tailored impact statements.</p>
                      </div>

                      <div className="space-y-6">
                        {atsReport.bulletPointComparisons.map((comp: any, idx: number) => {
                          const cleanSuggested = comp.suggested ? comp.suggested.toLowerCase().trim().replace(/\s+/g, ' ') : '';
                          const isAdopted = Boolean(comp.applied || (cleanSuggested && fullResumeText.includes(cleanSuggested)));

                          return (
                            <div key={idx} className="p-4.5 rounded-xl border border-zinc-150 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-950/40 grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                              {/* Original */}
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase">Original phrasing</span>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-normal">{comp.original}</p>
                              </div>

                              {/* Suggested */}
                              <div className="space-y-3 border-l border-zinc-200 md:pl-6 dark:border-zinc-800">
                                <div>
                                  <span className="text-[10px] font-bold text-indigo-500 uppercase flex items-center gap-1">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    AI STAR Suggestion
                                  </span>
                                  <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-normal mt-1">{comp.suggested}</p>
                                </div>

                                <div className="flex justify-end pt-1.5">
                                  <button
                                    onClick={() => handleApplyBullet(comp)}
                                    disabled={isAdopted}
                                    className={`px-3.5 py-1.5 rounded-lg text-[10px] font-bold shadow-sm transition-all ${isAdopted
                                      ? 'bg-emerald-500 text-white cursor-default opacity-90'
                                      : 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
                                      }`}
                                  >
                                    {isAdopted ? 'Adopted ✓' : 'Adopt AI Phrasing'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* Export Options Bottom Section */}
        <div className="mt-12 flex flex-col items-center justify-center space-y-4 border-t border-zinc-200 dark:border-zinc-800 pt-8">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-black tracking-tight">Export Finished Resume</h2>
            <p className="text-xs text-zinc-500">Download your tailored, ATS-optimized resume to apply.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-2">
            <button
              onClick={handleExportPDF}
              className="flex items-center justify-center gap-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/50 dark:text-red-400 px-8 py-3.5 text-sm font-bold transition-all cursor-pointer border border-red-100 dark:border-red-900/50 shadow-sm hover:-translate-y-0.5"
            >
              <Download className="h-5 w-5" />
              Download PDF
            </button>
            <button
              onClick={handleExportDOCX}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-900/50 dark:text-blue-400 px-8 py-3.5 text-sm font-bold transition-all cursor-pointer border border-blue-100 dark:border-blue-900/50 shadow-sm hover:-translate-y-0.5"
            >
              <FileText className="h-5 w-5" />
              Download DOCX
            </button>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-8 border-t border-zinc-200 dark:border-zinc-800 mt-8 mb-4">
          {activeCompany ? (
            <Link
              to={`/company/${activeCompany._id}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-3 sm:py-2.5 text-sm font-bold text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-all cursor-pointer w-full sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              Back (Company Details)
            </Link>
          ) : (
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-3 sm:py-2.5 text-sm font-bold text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-all cursor-pointer w-full sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              Back (Dashboard)
            </Link>
          )}

          <Link
            to="/interview-preparation"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 sm:py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition-all cursor-pointer w-full sm:w-auto"
          >
            Next (Interview Preparation)
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-500 rounded-full">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Delete Resume</h3>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
              Are you sure you want to delete this resume? This action cannot be undone and you will lose all modifications made to this tailored draft.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteResume}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20 transition-all cursor-pointer"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
};
