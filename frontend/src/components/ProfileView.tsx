import React, { useState, useRef } from 'react';
import { UserRole, UserProfile } from '../types';
import { API_BASE, API_ORIGIN } from '../services/api';

interface ProfileViewProps {
  currentUser: UserProfile;
  onUpdateProfile: (updatedProfile: UserProfile) => void;
  triggerToast: (title: string, text: string, type: 'success' | 'info' | 'error') => void;
}

export default function ProfileView({
  currentUser,
  onUpdateProfile,
  triggerToast
}: ProfileViewProps) {

  // Form State
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [college, setCollege] = useState(currentUser.college || '');
  const [graduationYear, setGraduationYear] = useState(currentUser.graduationYear || '');
  const [portfolioUrl, setPortfolioUrl] = useState(currentUser.portfolioUrl || '');
  const [companyName, setCompanyName] = useState(currentUser.companyName || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || '');
  const [isEnhancing, setIsEnhancing] = useState(false);

  // Social Links States
  const [githubUrl, setGithubUrl] = useState(currentUser.githubUrl || '');
  const [linkedinUrl, setLinkedinUrl] = useState(currentUser.linkedinUrl || '');
  const [xUrl, setXUrl] = useState(currentUser.xUrl || '');

  // Skills input & tag list
  const [skills, setSkills] = useState<string[]>(currentUser.skills || []);
  const [newSkillText, setNewSkillText] = useState('');

  // Resume State
  const [resumeName, setResumeName] = useState(currentUser.resumeName || '');
  const [resumeUrl, setResumeUrl] = useState(currentUser.resumeUrl || '');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Grades & Certificates State
  const [grades, setGrades] = useState<{ semester: string; gpa: string }[]>(() => {
    const saved = currentUser.grades;
    if (saved && saved.length > 0) {
      return Array.from({ length: 8 }, (_, i) => {
        const semesterName = `Semester ${i + 1}`;
        const existing = saved.find(g => g.semester === semesterName);
        return {
          semester: semesterName,
          gpa: existing ? existing.gpa : ''
        };
      });
    }
    return [
      { semester: 'Semester 1', gpa: '' },
      { semester: 'Semester 2', gpa: '' },
      { semester: 'Semester 3', gpa: '' },
      { semester: 'Semester 4', gpa: '' },
      { semester: 'Semester 5', gpa: '' },
      { semester: 'Semester 6', gpa: '' },
      { semester: 'Semester 7', gpa: '' },
      { semester: 'Semester 8', gpa: '' }
    ];
  });

  // Which semester indices are "unlocked" (visible as editable cards)
  const [activeSems, setActiveSems] = useState<number[]>(() => {
    const saved = currentUser.grades || [];
    return saved
      .map((g, i) => {
        const semesterNum = parseInt(g.semester.replace('Semester ', ''), 10);
        const idx = isNaN(semesterNum) ? i : semesterNum - 1;
        return { gpa: g.gpa, idx };
      })
      .filter(({ gpa }) => typeof gpa === 'string' && gpa.trim() !== '' && !isNaN(parseFloat(gpa)))
      .map(({ idx }) => idx);
  });

  const [certificates, setCertificates] = useState<{ name: string; issuer: string; date: string; credentialUrl?: string }[]>(
    currentUser.certificates || []
  );

  // New certificate inputs
  const [certName, setCertName] = useState('');
  const [certIssuer, setCertIssuer] = useState('');
  const [certDate, setCertDate] = useState('');
  const [certLink, setCertLink] = useState('');

  // Suggested skills to tap to add
  const suggestedSkills = ['React', 'TypeScript', 'Tailwind CSS', 'Figma', 'Node.js', 'Python', 'SQL', 'Product Planning'];

  const handleAddSkill = (skill: string) => {
    const cleaned = skill.trim();
    if (!cleaned) return;
    if (skills.includes(cleaned)) {
      triggerToast('Skill Exists', `${cleaned} is already present in your credentials.`, 'info');
      return;
    }
    setSkills([...skills, cleaned]);
    setNewSkillText('');
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  // RESTful API File Upload Handler
  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('resume', file);

    try {
      triggerToast('Uploading Resume', 'Uploading PDF to primary server database...', 'info');
      const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (data.success) {
        setResumeName(data.filename);
        const urlToUse = data.url.startsWith('http://') || data.url.startsWith('https://') 
          ? data.url 
          : `${API_ORIGIN}${data.url}`;
        setResumeUrl(urlToUse);
        triggerToast('Upload Successful', `Attached and verified: ${data.filename}`, 'success');
      } else {
        triggerToast('Upload Failed', data.error || 'Server rejected file.', 'error');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Upload Error', 'Could not establish connection to file upload database.', 'error');
    }
  };

  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append('avatar', file);

    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      triggerToast('Uploading Photo', 'Sending avatar to secure Cloudinary servers...', 'info');
      const response = await fetch(`${API_BASE}/users/upload-avatar`, {
        method: 'POST',
        headers,
        body: formData
      });
      const data = await response.json();
      if (data.success) {
        setAvatarUrl(data.url);
        triggerToast('Photo Updated', 'Your profile picture has been secure-uploaded!', 'success');
      } else {
        triggerToast('Upload Failed', data.error || 'Server rejected photo.', 'error');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Upload Error', 'Could not establish connection to photo database.', 'error');
    }
  };

  const handleEnhanceBio = async () => {
    if (!bio.trim()) {
      triggerToast('Empty Bio', 'Please write something in your bio first so we can enhance it!', 'info');
      return;
    }

    setIsEnhancing(true);
    triggerToast('AI Enhancing', 'Polishing biography via Groq artificial intelligence...', 'info');

    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE}/users/enhance-bio`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ bio })
      });
      const data = await response.json();
      if (data.success) {
        setBio(data.enhancedBio);
        if (data.simulated) {
          triggerToast('Bio Enhanced', 'Polished bio rendered successfully (Simulated Offline Mode).', 'success');
        } else {
          triggerToast('Bio Enhanced', 'Polished bio generated via Groq AI!', 'success');
        }
      } else {
        triggerToast('Enhancement Failed', data.error || 'AI service could not process draft.', 'error');
      }
    } catch (err) {
      console.error(err);
      triggerToast('AI Error', 'Could not establish connection to Groq service.', 'error');
    } finally {
      setIsEnhancing(false);
    }
  };

  // Drag and drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        uploadFile(file);
      } else {
        triggerToast('Unsupported format', 'Please upload a PDF document.', 'error');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updated: UserProfile = {
      ...currentUser,
      name,
      email,
      bio,
      avatarUrl,
      college,
      graduationYear,
      portfolioUrl,
      companyName,
      skills,
      resumeName,
      resumeUrl,
      githubUrl,
      linkedinUrl,
      xUrl,
      grades,
      certificates,
      studentProfileVerificationStatus: currentUser.role === 'Student' ? 'Pending' : currentUser.studentProfileVerificationStatus,
      studentProfileVerificationRemark: currentUser.role === 'Student' ? '' : currentUser.studentProfileVerificationRemark
    };

    onUpdateProfile(updated);
    triggerToast('Profile Locked', 'Saved and updated university records successfully.', 'success');
  };

  return (
    <div className="space-y-6 fade-in-up">
      
      {/* Page header */}
      <div className="border-b border-slate-200 pb-5 text-left">
        <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px] uppercase tracking-widest mb-1.5">
          <i className="fa-solid fa-wand-magic-sparkles text-brand-600 text-[11px] animate-pulse" />
          <span className="ml-1">Profile configuration</span>
        </div>
        <h1 className="text-2xl font-serif font-semibold text-slate-900 tracking-tight font-display">
          Applicant Dossier & Placement Documents
        </h1>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
          Maintain your portfolios, credential skill-sets, and attach live PDF resumes for automatic placement submissions.
        </p>
      </div>

      {/* Verification Status Banner */}
      {currentUser.role === 'Student' && (
        <div className="text-left font-sans">
          {currentUser.studentProfileVerificationStatus === 'Verified' ? (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-start gap-3 shadow-xs">
              <i className="fa-solid fa-circle-check text-emerald-600 text-lg mt-0.5" />
              <div>
                <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-emerald-700">Profile Verified</h4>
                <p className="text-xs text-emerald-655 mt-1 leading-relaxed">
                  Your academic placement credentials have been vetted and verified by Faculty coordinators. You are fully eligible to apply for internship placement opportunities!
                </p>
                {currentUser.studentProfileVerifiedBy && (
                  <p className="text-[10px] text-emerald-500 font-mono mt-1">Verified by: {currentUser.studentProfileVerifiedBy}</p>
                )}
              </div>
            </div>
          ) : currentUser.studentProfileVerificationStatus === 'Unverified' ? (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-start gap-3 shadow-xs">
              <i className="fa-solid fa-triangle-exclamation text-rose-600 text-lg mt-0.5" />
              <div className="flex-1">
                <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-rose-700">Profile Vetting Flagged</h4>
                <p className="text-xs text-rose-655 mt-1 leading-relaxed">
                  Your profile verification was flagged/rejected by the placement coordinators. Please review the feedback remark, correct your details, and save your changes to resubmit for verification.
                </p>
                {currentUser.studentProfileVerificationRemark && (
                  <div className="mt-2.5 p-3 bg-white border border-rose-100 rounded-lg text-rose-900 text-xs italic font-medium">
                    Feedback Remark: &ldquo;{currentUser.studentProfileVerificationRemark}&rdquo;
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-start gap-3 shadow-xs">
              <i className="fa-solid fa-circle-notch fa-spin text-amber-600 text-lg mt-0.5" />
              <div>
                <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-amber-700">Awaiting Verification Review</h4>
                <p className="text-xs text-amber-655 mt-1 leading-relaxed">
                  Your profile coordinates are currently pending vetting compliance check. You will be able to apply to internships once Faculty approves your credentials.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
        
        {/* Left Side (8 col) - Biographical Details */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-6">
            
            <h3 className="text-sm font-mono uppercase tracking-widest text-slate-900 font-bold border-b border-slate-200 pb-2">
              Biographical Coordinates
            </h3>

            {/* Premium Profile Photo Widget */}
            <div className="flex flex-col md:flex-row items-center gap-5 p-4 bg-white border border-slate-200 rounded-xl">
              <div className="relative h-20 w-20 rounded-full bg-brand-600 text-white font-semibold flex items-center justify-center font-serif shadow-inner select-none overflow-hidden group border-2 border-brand-500 shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover animate-fade-in" />
                ) : (
                  <span className="text-2xl font-bold uppercase">{name.charAt(0) || 'U'}</span>
                )}
              </div>
              <div className="flex-1 text-center md:text-left space-y-1">
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-900 font-bold">Applicant Identity Portrait</h4>
                <p className="text-[10px] text-slate-400 font-mono leading-normal">
                  Upload a high-resolution professional avatar. JPEG, PNG or WEBP formats up to 2MB.
                </p>
                <div className="flex flex-wrap gap-2 pt-1 justify-center md:justify-start select-none">
                  <input
                    type="file"
                    ref={avatarInputRef}
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-brand-600 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    <i className="fa-solid fa-cloud-arrow-up text-[11px]" /> Upload Photo
                  </button>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setAvatarUrl('');
                        triggerToast('Photo Removed', 'Cleared avatar path from active form.', 'info');
                      }}
                      className="px-3 py-1.5 bg-white hover:bg-red-50 text-red-650 hover:text-red-700 border border-slate-200 hover:border-red-200 rounded-lg text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      <i className="fa-solid fa-trash-can text-[10px]" /> Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold">Full Legal Name</label>
                <input
                  id="profile-name-input"
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-brand-600 px-3.5 py-2 rounded-lg text-xs font-sans outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold">Verified Email Address</label>
                <input
                  id="profile-email-input"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-brand-600 px-3.5 py-2 rounded-lg text-xs font-sans outline-hidden"
                />
              </div>

              {currentUser.role === 'Student' ? (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold">Current Enrolled College</label>
                    <input
                      id="profile-college-input"
                      type="text"
                      placeholder="e.g. Stanford University"
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:border-brand-600 px-3.5 py-2 rounded-lg text-xs font-sans outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold">Anticipated Graduation</label>
                    <input
                      id="profile-gradyear-input"
                      type="text"
                      placeholder="e.g. 2027"
                      value={graduationYear}
                      onChange={(e) => setGraduationYear(e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:border-brand-600 px-3.5 py-2 rounded-lg text-xs font-sans outline-hidden"
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold flex justify-between select-none">
                      <span>Personal Biography Dossier</span>
                      <button
                        type="button"
                        onClick={handleEnhanceBio}
                        disabled={isEnhancing}
                        className="text-brand-600 hover:text-brand-700 flex items-center gap-1 font-sans text-[10px] font-bold cursor-pointer transition-colors"
                      >
                        {isEnhancing ? (
                          <i className="fa-solid fa-spinner fa-spin text-[9px]" />
                        ) : (
                          <i className="fa-solid fa-wand-magic-sparkles text-[9px]" />
                        )}
                        <span>AI Enhance Bio</span>
                      </button>
                    </label>
                    <textarea
                      id="profile-bio-textarea"
                      rows={4}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Share a summary of your core projects, engineering achievements and placement goals..."
                      className="w-full bg-white border border-slate-200 focus:border-brand-600 rounded-lg p-3 text-xs font-sans resize-none outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold">Personal Portfolio Website</label>
                    <input
                      id="profile-portfolio-input"
                      type="url"
                      placeholder="https://portfolio.dev"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:border-brand-600 px-3.5 py-2 rounded-lg text-xs font-sans outline-hidden"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold">Sponsoring Enterprise Name</label>
                  <input
                    id="profile-company-input"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-brand-600 px-3.5 py-2 rounded-lg text-xs font-sans outline-hidden"
                  />
                </div>
              )}
            </div>

            {/* Social Coordinates Section */}
            <div className="border-t border-slate-200 pt-5 space-y-4">
              <h4 className="text-xs font-mono uppercase tracking-widest text-slate-900 font-bold">Social Coordinates</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                    <i className="fa-brands fa-github text-slate-900 text-[12px]" /> GitHub Profile
                  </label>
                  <input
                    id="profile-github-input"
                    type="url"
                    placeholder="https://github.com/username"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-brand-600 px-3.5 py-2 rounded-lg text-xs font-sans outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                    <i className="fa-brands fa-linkedin text-blue-700 text-[12px]" /> LinkedIn Profile
                  </label>
                  <input
                    id="profile-linkedin-input"
                    type="url"
                    placeholder="https://linkedin.com/in/username"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-brand-600 px-3.5 py-2 rounded-lg text-xs font-sans outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                    <i className="fa-brands fa-x-twitter text-slate-900 text-[12px]" /> X (Twitter) Channel
                  </label>
                  <input
                    id="profile-x-input"
                    type="url"
                    placeholder="https://x.com/username"
                    value={xUrl}
                    onChange={(e) => setXUrl(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-brand-600 px-3.5 py-2 rounded-lg text-xs font-sans outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Skill Tag Deck (Student focus) */}
          {currentUser.role === 'Student' && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-5">
              <h3 className="text-sm font-mono uppercase tracking-widest text-slate-900 font-bold border-b border-slate-200 pb-2 flex justify-between select-none">
                <span>Technical & Core competencies</span>
                <span className="font-sans normal-case text-slate-400 font-normal">Active Tags: {skills.length}</span>
              </h3>

              {/* Skills Deck */}
              <div className="flex flex-wrap gap-1.5" id="profile-skills-deck">
                {skills.length === 0 ? (
                  <p className="text-xs text-slate-400 italic select-none text-left">No skill tags listed. Add tags below to populate your card.</p>
                ) : (
                  skills.map((skill) => (
                    <span 
                      key={skill} 
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-slate-800 border border-slate-200 text-xs font-mono rounded-lg transition-all"
                    >
                      <span>{skill}</span>
                      <button
                        type="button" 
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer flex items-center"
                        title={`Remove ${skill}`}
                      >
                        <i className="fa-solid fa-trash-can text-[10px]" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Manual Entry Form */}
              <div className="flex gap-2.5">
                <input
                  id="profile-newskill-input"
                  type="text"
                  placeholder="Insert custom tag (e.g. Kubernetes, Ruby)"
                  value={newSkillText}
                  onChange={(e) => setNewSkillText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill(newSkillText);
                    }
                  }}
                  className="bg-white border border-slate-200 focus:border-brand-600 px-3 py-2 rounded-lg text-xs font-sans flex-1 outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill(newSkillText)}
                  className="px-4 py-2 bg-slate-900 hover:bg-brand-600 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-plus text-xs" />
                  <span>Add</span>
                </button>
              </div>

              {/* Quick-tap Suggested list */}
              <div className="space-y-2 pt-2 border-t border-slate-200 text-left">
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block font-bold select-none">Suggested Quick Adding Tags</span>
                <div className="flex flex-wrap gap-1.5 select-none">
                  {suggestedSkills.filter(s => !skills.includes(s)).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleAddSkill(s)}
                      className="px-2.5 py-1 bg-white hover:bg-slate-900 hover:text-white border border-slate-200 hover:border-transparent rounded text-[11px] font-mono font-medium cursor-pointer transition-all"
                    >
                      +{s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Semester Grades (Student focus) */}
          {currentUser.role === 'Student' && (() => {
            const activeGrades = activeSems.map(i => ({ idx: i, ...grades[i] }));
            const filled = activeGrades.filter(g => g.gpa.trim() !== '' && !isNaN(parseFloat(g.gpa)));
            const overallCgpa = filled.length > 0
              ? (filled.reduce((sum, g) => sum + parseFloat(g.gpa), 0) / filled.length).toFixed(2)
              : null;
            const nextIdx = grades.findIndex((_, i) => !activeSems.includes(i));

            const gpaColors = (val: string) => {
              const n = parseFloat(val);
              if (isNaN(n) || val.trim() === '') return { badge: 'bg-slate-100 text-slate-400', bar: '#cbd5e1', ring: 'border-slate-200' };
              if (n >= 9)   return { badge: 'bg-emerald-100 text-emerald-700', bar: '#10b981', ring: 'border-emerald-300' };
              if (n >= 8)   return { badge: 'bg-purple-100 text-purple-700',   bar: '#9333ea', ring: 'border-purple-300' };
              if (n >= 7)   return { badge: 'bg-blue-100 text-blue-700',        bar: '#3b82f6', ring: 'border-blue-300'  };
              if (n >= 6)   return { badge: 'bg-amber-100 text-amber-700',      bar: '#f59e0b', ring: 'border-amber-300' };
              return           { badge: 'bg-red-100 text-red-600',              bar: '#ef4444', ring: 'border-red-300'   };
            };

            return (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-5">

                {/* Header */}
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <h3 className="text-sm font-mono uppercase tracking-widest text-slate-900 font-bold">
                      Academic Transcript — Semester CGPA
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Add semesters one by one and enter your CGPA (0–10). Overall is computed automatically.
                    </p>
                  </div>
                  {overallCgpa && (
                    <div className="flex-shrink-0 flex flex-col items-center bg-white border border-purple-200 rounded-2xl px-5 py-3 shadow-sm">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest whitespace-nowrap">Overall CGPA</span>
                      <span className="text-3xl font-bold text-purple-700 font-mono leading-none mt-0.5">{overallCgpa}</span>
                      <span className="text-[9px] text-slate-400 mt-0.5">{filled.length} / 8 semesters</span>
                    </div>
                  )}
                </div>

                {/* Active semester cards — flex-wrap like skills */}
                {activeGrades.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {activeGrades.map(({ idx, gpa }) => {
                      const c = gpaColors(gpa);
                      const pct = gpa.trim() !== '' && !isNaN(parseFloat(gpa))
                        ? Math.min((parseFloat(gpa) / 10) * 100, 100) : 0;
                      return (
                        <div key={idx}
                          className={`relative bg-white border-2 ${c.ring} rounded-2xl p-3 flex flex-col gap-2 transition-all hover:shadow-md`}
                          style={{ minWidth: '120px', width: '140px' }}>

                          {/* × remove button */}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSems(prev => prev.filter(i => i !== idx));
                              setGrades(prev => prev.map((item, i) => i === idx ? { ...item, gpa: '' } : item));
                            }}
                            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-slate-200 hover:bg-red-100 hover:text-red-600 text-slate-500 text-[10px] flex items-center justify-center transition-colors cursor-pointer border border-white shadow-sm"
                          >
                            <i className="fa-solid fa-xmark" />
                          </button>

                          {/* Sem label + gpa badge */}
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">Sem {idx + 1}</span>
                            {gpa.trim() !== '' && !isNaN(parseFloat(gpa)) && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${c.badge}`}>
                                {parseFloat(gpa).toFixed(1)}
                              </span>
                            )}
                          </div>

                          {/* Progress bar */}
                          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, background: c.bar }} />
                          </div>

                          {/* CGPA input */}
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="e.g. 8.5"
                            value={gpa}
                            onChange={e => {
                              const val = e.target.value;
                              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                setGrades(prev => prev.map((item, i) => i === idx ? { ...item, gpa: val } : item));
                              }
                            }}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-purple-400 focus:outline-none px-2 py-1.5 rounded-lg text-xs font-mono text-center text-slate-900 placeholder-slate-300"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* + Add Semester button */}
                {nextIdx !== -1 ? (
                  <button
                    type="button"
                    onClick={() => setActiveSems(prev => [...prev, nextIdx])}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-purple-300 text-purple-600 text-xs font-bold hover:bg-purple-50 hover:border-purple-400 transition-all cursor-pointer"
                  >
                    <i className="fa-solid fa-plus text-[10px]" />
                    Add Semester {nextIdx + 1}
                  </button>
                ) : (
                  <p className="text-[10px] font-mono text-slate-400 italic">All 8 semesters added.</p>
                )}

                {/* Grade colour legend */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider mr-1">Scale:</span>
                  {[
                    { label: '≥ 9.0 Excellent', cls: 'bg-emerald-100 text-emerald-700' },
                    { label: '≥ 8.0 Very Good',  cls: 'bg-purple-100 text-purple-700'  },
                    { label: '≥ 7.0 Good',        cls: 'bg-blue-100 text-blue-700'      },
                    { label: '≥ 6.0 Average',     cls: 'bg-amber-100 text-amber-700'    },
                    { label: '< 6.0 Below Avg',   cls: 'bg-red-100 text-red-600'        },
                  ].map(({ label, cls }) => (
                    <span key={label} className={`text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Certifications (Student focus) */}
          {currentUser.role === 'Student' && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-5 text-left">
              <h3 className="text-sm font-mono uppercase tracking-widest text-slate-900 font-bold border-b border-slate-200 pb-2 flex justify-between select-none">
                <span>Professional Certifications</span>
                <span className="font-sans normal-case text-slate-400 font-normal">Active: {certificates.length}</span>
              </h3>
              
              {/* Active Certificates List */}
              <div className="space-y-3">
                {certificates.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No certifications added yet. Enter certification credentials below.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {certificates.map((cert, idx) => (
                      <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-900 leading-tight">{cert.name}</p>
                          <p className="text-[10px] text-slate-550">{cert.issuer} • {cert.date}</p>
                          {cert.credentialUrl && (
                            <a href={cert.credentialUrl} target="_blank" rel="noreferrer" className="text-[9px] font-bold text-brand-600 hover:underline inline-flex items-center gap-0.5">
                              View credential <i className="fa-solid fa-up-right-from-square text-[8px]" />
                            </a>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setCertificates(prev => prev.filter((_, i) => i !== idx))}
                          className="text-slate-450 hover:text-red-650 transition-colors p-1 cursor-pointer"
                        >
                          <i className="fa-solid fa-trash-can text-xs" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Certificate Form */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">Add Certificate Credentials</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-450">Certificate Name</label>
                    <input
                      type="text"
                      placeholder="e.g. AWS Certified Solutions Architect"
                      value={certName}
                      onChange={(e) => setCertName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-brand-600 px-3 py-1.5 rounded-lg text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-450">Issuing Organization</label>
                    <input
                      type="text"
                      placeholder="e.g. Amazon Web Services"
                      value={certIssuer}
                      onChange={(e) => setCertIssuer(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-brand-600 px-3 py-1.5 rounded-lg text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-455">Date Issued</label>
                    <input
                      type="text"
                      placeholder="e.g. Oct 2025"
                      value={certDate}
                      onChange={(e) => setCertDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-brand-600 px-3 py-1.5 rounded-lg text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-455">Credential URL (Optional)</label>
                    <input
                      type="url"
                      placeholder="https://cred.ly/..."
                      value={certLink}
                      onChange={(e) => setCertLink(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-brand-600 px-3 py-1.5 rounded-lg text-xs"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!certName || !certIssuer || !certDate) {
                        triggerToast('Verification Error', 'Please fill name, issuer, and date issued details.', 'error');
                        return;
                      }
                      setCertificates(prev => [...prev, { name: certName, issuer: certIssuer, date: certDate, credentialUrl: certLink }]);
                      setCertName('');
                      setCertIssuer('');
                      setCertDate('');
                      setCertLink('');
                      triggerToast('Certificate Added', `Added: ${certName}`, 'success');
                    }}
                    className="px-4 py-2 bg-slate-900 hover:bg-brand-600 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <i className="fa-solid fa-plus text-xs" /> Add Certification
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Settle save button */}
          <div className="flex justify-end pt-2 select-none">
            <button
              id="profile-save-action-btn"
              type="submit"
              className="px-6 py-2.5 bg-slate-900 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow hover:scale-102 cursor-pointer transition-all flex items-center gap-1.5"
            >
              <i className="fa-solid fa-floppy-disk text-xs" />
              <span>Save Dossier Changes</span>
            </button>
          </div>
        </div>

        {/* Right Zone (4 col) - Resume Upload Zone (Student focus) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-mono uppercase tracking-widest text-slate-900 font-bold border-b border-slate-200 pb-2">
              Corporate Resume
            </h3>

            {currentUser.role === 'Student' ? (
              <>
                <p className="text-xs text-slate-500 leading-normal font-sans text-left select-none">
                  Recruiters verify and query student profiles through centralized resume uploads.
                </p>

                {/* Drag and Drop Zone */}
                <div
                  id="resume-drag-drop-zone"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all select-none ${
                    isDragging 
                      ? 'border-brand-600 bg-white scale-102 shadow-xs' 
                      : 'border-slate-200 hover:border-brand-650 hover:bg-white'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <i className="fa-solid fa-cloud-arrow-up text-brand-600 text-3xl mb-3 animate-bounce block" style={{ animationDuration: '3s' }} />
                  <p className="text-xs font-bold text-slate-900">Drag & drop your PDF resume</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">or click to browse local folders</p>
                  <p className="text-[9px] text-slate-400 mt-4 font-mono">Limit 5MB • PDF files only</p>
                </div>

                {/* Selected File list */}
                <div className="p-3 bg-white border border-slate-200 rounded-xl text-left space-y-2">
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block font-bold select-none">Attached Document</span>
                  <div className="flex items-center gap-2 text-xs">
                    <i className="fa-solid fa-file-invoice text-brand-600 text-lg shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 truncate" id="verified-resume-label">
                        {resumeName || 'No resume attached'}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono flex items-center justify-between mt-0.5">
                        <span>Adobe PDF document</span>
                        {resumeUrl && (
                          <a 
                            href={resumeUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-brand-600 font-bold hover:underline inline-flex items-center gap-0.5 lowercase font-sans transition-all select-none"
                          >
                            view <i className="fa-solid fa-up-right-from-square text-[9px] ml-0.5" />
                          </a>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-3 bg-white border border-slate-200 rounded-xl text-left text-xs text-slate-500 leading-relaxed">
                <i className="fa-solid fa-briefcase text-brand-600 mb-2 text-sm block" />
                Documents folders are reserved for undergraduate applicants. Recruiter credentials allow editing biography indexes.
              </div>
            )}
          </div>

          {/* Real-time system information visual panel */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3.5 text-left select-none">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-bold">Placera Security Clearance</span>
            <div className="space-y-2 font-sans">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Account Clearance:</span>
                <span className="font-bold text-slate-900 font-mono lowercase">{currentUser.role}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Academic Status:</span>
                <span className="font-bold text-brand-600 uppercase text-[10px] tracking-wider">
                  {currentUser.role === 'Student' ? (currentUser.studentProfileVerificationStatus || 'Unverified') : 'Verified Member'}
                </span>
              </div>
              {currentUser.role === 'Student' && currentUser.studentProfileVerificationStatus === 'Unverified' && currentUser.studentProfileVerificationRemark && (
                <div className="mt-2 p-2 bg-rose-50 border border-rose-200 rounded text-[10px] text-rose-700 font-sans italic">
                  Remark: {currentUser.studentProfileVerificationRemark}
                </div>
              )}
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
