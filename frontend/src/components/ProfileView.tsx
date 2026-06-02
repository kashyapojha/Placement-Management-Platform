import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Plus, 
  Trash2, 
  Check, 
  Sparkles, 
  ExternalLink,
  Save,
  Grid,
  MapPin,
  Clock,
  Briefcase,
  Github,
  Linkedin,
  Twitter
} from 'lucide-react';
import { UserRole, UserProfile } from '../types';

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
      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (data.success) {
        setResumeName(data.filename);
        const backendUrl = `http://localhost:5000${data.url}`;
        setResumeUrl(backendUrl);
        triggerToast('Upload Successful', `Attached and verified: ${data.filename}`, 'success');
      } else {
        triggerToast('Upload Failed', data.error || 'Server rejected file.', 'error');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Upload Error', 'Could not establish connection to file upload database.', 'error');
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
      college,
      graduationYear,
      portfolioUrl,
      companyName,
      skills,
      resumeName,
      resumeUrl,
      githubUrl,
      linkedinUrl,
      xUrl
    };

    onUpdateProfile(updated);
    triggerToast('Profile Locked', 'Saved and updated university records successfully.', 'success');
  };

  return (
    <div className="space-y-6 fade-in-up">
      
      {/* Page header */}
      <div className="border-b border-[#F1F0EC] pb-5">
        <div className="flex items-center gap-1.5 text-[#94A3B8] font-mono text-[11px] uppercase tracking-widest mb-1.5">
          <Sparkles size={11} className="text-editorial-light" />
          <span>Profile configuration</span>
        </div>
        <h1 className="text-2xl font-serif font-semibold text-editorial tracking-tight">
          Applicant Dossier & Verification documents
        </h1>
        <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">
          Maintain your portfolios, credential skill-sets, and attach live PDF resumes for automatic corporate submissions.
        </p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
        
        {/* Left Side (8 col) - Biographical Details */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-[#F9F8F6] border border-[#E5E2DE] rounded-2xl p-6 space-y-6">
            
            <h3 className="text-sm font-mono uppercase tracking-widest text-editorial font-semibold border-b border-[#E5E2DE] pb-2">
              Biographical Coordinates
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-wider text-[#94A3B8] font-bold">Full Legal Name</label>
                <input
                  id="profile-name-input"
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-[#E5E2DE] focus:border-editorial-light px-3.5 py-2 rounded-lg text-xs font-sans outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-wider text-[#94A3B8] font-bold">Verified Email Address</label>
                <input
                  id="profile-email-input"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-[#E5E2DE] focus:border-editorial-light px-3.5 py-2 rounded-lg text-xs font-sans outline-hidden"
                />
              </div>

              {currentUser.role === 'Student' ? (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono tracking-wider text-[#94A3B8] font-bold">Current Enrolled College</label>
                    <input
                      id="profile-college-input"
                      type="text"
                      placeholder="e.g. Stanford University"
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      className="w-full bg-white border border-[#E5E2DE] focus:border-editorial-light px-3.5 py-2 rounded-lg text-xs font-sans outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono tracking-wider text-[#94A3B8] font-bold">Anticipated Graduation</label>
                    <input
                      id="profile-gradyear-input"
                      type="text"
                      placeholder="e.g. 2027"
                      value={graduationYear}
                      onChange={(e) => setGraduationYear(e.target.value)}
                      className="w-full bg-white border border-[#E5E2DE] focus:border-editorial-light px-3.5 py-2 rounded-lg text-xs font-sans outline-hidden"
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] uppercase font-mono tracking-wider text-[#94A3B8] font-bold flex justify-between">
                      <span>Live Portfolio URI</span>
                      {portfolioUrl && (
                        <a href={portfolioUrl} target="_blank" rel="noreferrer" className="text-editorial font-bold hover:underline inline-flex items-center gap-0.5 lowercase font-sans transition-all">
                          visit <ExternalLink size={10} />
                        </a>
                      )}
                    </label>
                    <input
                      id="profile-portfoliourl-input"
                      type="url"
                      placeholder="https://myportfolio.dev"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      className="w-full bg-white border border-[#E5E2DE] focus:border-editorial-light px-3.5 py-2 rounded-lg text-xs font-sans outline-hidden"
                    />
                  </div>
                </>
              ) : currentUser.role === 'Company' ? (
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-[#94A3B8] font-bold">Affiliated Enterprise Institution</label>
                  <input
                    id="profile-company-input"
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-white border border-[#E5E2DE] focus:border-editorial-light px-3.5 py-2 rounded-lg text-xs font-sans outline-hidden"
                  />
                </div>
              ) : (
                <div className="space-y-1 md:col-span-2">
                  <div className="p-3 bg-[#F9F8F6] border border-[#E5E2DE] rounded-xl">
                    <p className="text-xs text-editorial">
                      <strong>Administrative Clearance:</strong> You carry platform administrator level access. Profile credentials edit will sync across main panels.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono tracking-wider text-[#94A3B8] font-bold">Professional Bio / Elevator pitch</label>
              <textarea
                id="profile-bio-input"
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Author a brief introductory summary on your technology specialties, project accomplishments, and career timeline aspirations..."
                className="w-full bg-white border border-[#E5E2DE] rounded-xl p-3.5 text-xs font-sans leading-relaxed resize-none focus:border-editorial-light outline-hidden"
              />
            </div>

          </div>

          {/* Social Media Coordinates */}
          {currentUser.role === 'Student' && (
            <div className="bg-[#F9F8F6] border border-[#E5E2DE] rounded-2xl p-6 space-y-6">
              <h3 className="text-sm font-mono uppercase tracking-widest text-editorial font-semibold border-b border-[#E5E2DE] pb-2">
                Social Portfolio Channels
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-[#94A3B8] font-bold flex items-center gap-1">
                    <Github size={12} className="text-editorial" /> GitHub Profile
                  </label>
                  <input
                    id="profile-github-input"
                    type="url"
                    placeholder="https://github.com/username"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className="w-full bg-white border border-[#E5E2DE] focus:border-editorial-light px-3.5 py-2 rounded-lg text-xs font-sans outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-[#94A3B8] font-bold flex items-center gap-1">
                    <Linkedin size={12} className="text-editorial" /> LinkedIn Handle
                  </label>
                  <input
                    id="profile-linkedin-input"
                    type="url"
                    placeholder="https://linkedin.com/in/username"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="w-full bg-white border border-[#E5E2DE] focus:border-editorial-light px-3.5 py-2 rounded-lg text-xs font-sans outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-[#94A3B8] font-bold flex items-center gap-1">
                    <Twitter size={12} className="text-editorial" /> X (Twitter) Channel
                  </label>
                  <input
                    id="profile-x-input"
                    type="url"
                    placeholder="https://x.com/username"
                    value={xUrl}
                    onChange={(e) => setXUrl(e.target.value)}
                    className="w-full bg-white border border-[#E5E2DE] focus:border-editorial-light px-3.5 py-2 rounded-lg text-xs font-sans outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Skill Tag Deck (Student focus) */}
          {currentUser.role === 'Student' && (
            <div className="bg-[#F9F8F6] border border-[#E5E2DE] rounded-2xl p-6 space-y-5">
              <h3 className="text-sm font-mono uppercase tracking-widest text-editorial font-bold border-b border-[#E5E2DE] pb-2 flex justify-between">
                <span>Technical & Core competencies</span>
                <span className="font-sans normal-case text-[#94A3B8] font-normal">Active Tags: {skills.length}</span>
              </h3>

              {/* Skills Deck */}
              <div className="flex flex-wrap gap-1.5" id="profile-skills-deck">
                {skills.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No skill tags listed. Add tags below to populate your card.</p>
                ) : (
                  skills.map((skill) => (
                    <span 
                      key={skill} 
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-editorial border border-[#E5E2DE] text-xs font-mono rounded-lg transition-all"
                    >
                      <span>{skill}</span>
                      <button
                        type="button" 
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-[#94A3B8] hover:text-rose-600 transition-colors cursor-pointer"
                        title={`Remove ${skill}`}
                      >
                        <Trash2 size={11} />
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
                  className="bg-white border border-[#E5E2DE] focus:border-editorial-light px-3 py-2 rounded-lg text-xs font-sans flex-1 outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill(newSkillText)}
                  className="px-4 py-2 bg-editorial hover:bg-editorial-light text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  <Plus size={13} className="inline mr-1" />
                  Add
                </button>
              </div>

              {/* Quick-tap Suggested list */}
              <div className="space-y-2 pt-2 border-t border-[#E5E2DE]">
                <span className="text-[9px] font-mono text-[#94A3B8] uppercase tracking-wider block font-bold">Suggested Quick Adding Tags</span>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedSkills.filter(s => !skills.includes(s)).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleAddSkill(s)}
                      className="px-2.5 py-1 bg-white hover:bg-editorial text-editorial hover:text-white border border-[#E5E2DE] hover:border-transparent rounded text-[11px] font-mono font-medium cursor-pointer transition-all"
                    >
                      +{s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Settle save button */}
          <div className="flex justify-end pt-2">
            <button
              id="profile-save-action-btn"
              type="submit"
              className="px-6 py-2.5 bg-editorial hover:bg-editorial-light text-white rounded-xl text-xs font-bold shadow hover:scale-102 cursor-pointer transition-all flex items-center gap-1.5"
            >
              <Save size={14} />
              Save Dossier Changes
            </button>
          </div>
        </div>

        {/* Right Side (4 col) - Resume Upload Document zone (Student focus) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#F9F8F6] border border-[#E5E2DE] rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-mono uppercase tracking-widest text-editorial font-bold border-b border-[#E5E2DE] pb-2">
              Corporate Resume
            </h3>

            {currentUser.role === 'Student' ? (
              <>
                <p className="text-xs text-[#64748B] leading-normal font-sans">
                  Recruiters verify and query student profiles through centralized resume uploads.
                </p>

                {/* Drag and Drop Zone */}
                <div
                  id="resume-drag-drop-zone"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                    isDragging 
                      ? 'border-editorial bg-white scale-102 shadow-xs' 
                      : 'border-[#E5E2DE] hover:border-editorial-light hover:bg-white'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Upload size={32} className="mx-auto text-editorial mb-3 animate-bounce" style={{ animationDuration: '3s' }} />
                  <p className="text-xs font-bold text-[#1A1C1E]">Drag & drop your PDF resume</p>
                  <p className="text-[10px] text-[#94A3B8] font-mono mt-1">or click to browse local folders</p>
                  <p className="text-[9px] text-[#94A3B8] mt-4 font-mono">Limit 5MB GÇó PDF files only</p>
                </div>

                {/* Selected File list */}
                <div className="p-3 bg-white border border-[#E5E2DE] rounded-xl text-left space-y-2">
                  <span className="text-[9px] font-mono text-[#94A3B8] uppercase tracking-wider block font-bold">Attached Document</span>
                  <div className="flex items-center gap-2 text-xs">
                    <FileText size={18} className="text-editorial" />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-[#1A1C1E] truncate" id="verified-resume-label">
                        {resumeName}
                      </p>
                      <p className="text-[10px] text-[#94A3B8] font-mono flex items-center justify-between">
                        <span>Adobe PDF document verified</span>
                        {resumeUrl && (
                          <a 
                            href={resumeUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-editorial font-bold hover:underline inline-flex items-center gap-0.5 lowercase font-sans transition-all"
                          >
                            view <ExternalLink size={10} />
                          </a>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-3 bg-white border border-[#E5E2DE] rounded-xl text-left text-xs text-[#64748B] leading-relaxed">
                <Briefcase className="text-editorial mb-2" size={18} />
                Documents folders are reserved for undergraduate applicants. Recruiter credentials allow editing biography indexes.
              </div>
            )}
          </div>

          {/* Real-time system information visual panel */}
          <div className="bg-[#F9F8F6] border border-[#E5E2DE] rounded-2xl p-5 space-y-3.5 text-left">
            <span className="text-[10px] font-mono text-[#94A3B8] uppercase tracking-wider block font-bold">Incipio Security Clearance</span>
            <div className="space-y-2 font-sans">
              <div className="flex justify-between text-xs text-[#64748B]">
                <span>Account Clearance:</span>
                <span className="font-bold text-[#1A1C1E] font-mono lowercase">{currentUser.role}</span>
              </div>
              <div className="flex justify-between text-xs text-[#64748B]">
                <span>Academic Status:</span>
                <span className="font-bold text-editorial uppercase text-[10px] tracking-wider">
                  {currentUser.role === 'Student' ? (currentUser.studentProfileVerificationStatus || 'Unverified') : 'Verified Intern'}
                </span>
              </div>
              {currentUser.role === 'Student' && currentUser.studentProfileVerificationStatus === 'Unverified' && currentUser.studentProfileVerificationRemark && (
                <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded p-2">
                  Faculty Remark: {currentUser.studentProfileVerificationRemark}
                </div>
              )}
              <div className="flex justify-between text-xs text-[#64748B]">
                <span>Last Updated:</span>
                <span className="font-bold text-[#1A1C1E] font-mono">Today, 05:30 AM</span>
              </div>
            </div>
          </div>
        </div>

      </form>

    </div>
  );
}

