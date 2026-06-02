import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, 
  Filter, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Plus, 
  ArrowRight, 
  X, 
  Check, 
  Sparkles,
  Info,
  ChevronRight,
  FileText,
  UserCheck,
  Award
} from 'lucide-react';
import { UserRole, UserProfile, Internship, Application } from '../types';

interface ListingsViewProps {
  currentRole: UserRole;
  currentUser: UserProfile | null;
  internships: Internship[];
  applications: Application[];
  allUsers: UserProfile[];
  onAddListing: (listing: Internship) => void;
  onApply: (internshipId: string, coverLetter: string, resumeName: string) => void;
  triggerToast: (title: string, text: string, type: 'success' | 'info' | 'error') => void;
  listingsFilter: string;
  setListingsFilter: (filter: string) => void;
  onPromptAuth?: () => void;
  onDeleteListing: (listingId: string) => void;
  onFacultyReviewListing?: (listingId: string, status: 'Verified' | 'Unverified', remark?: string) => void;
  onFacultyVerifyRecruiter?: (recruiterId: string, status: 'Genuine' | 'Not Genuine', reason?: string) => void;
}

export default function ListingsView({
  currentRole,
  currentUser,
  internships,
  applications,
  allUsers,
  onAddListing,
  onApply,
  triggerToast,
  listingsFilter,
  setListingsFilter,
  onPromptAuth,
  onDeleteListing,
  onFacultyReviewListing,
  onFacultyVerifyRecruiter
}: ListingsViewProps) {

  // Search & Tag Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Selected Internship for "View Detail Drawer"
  const [selectedListing, setSelectedListing] = useState<Internship | null>(null);

  // Modals Controller
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  // Instant One-Click Job Application Flow
  const handleQuickApply = (listing: Internship) => {
    if (!currentUser) return;
    if (!currentUser.resumeName) {
      triggerToast(
        'Resume Needed', 
        'Please upload a verified PDF resume in your Profile configurations first to activate One-Click Apply.', 
        'error'
      );
      return;
    }
    
    onApply(listing.id, "Applied via One-Click Quick Apply.", currentUser.resumeName);
    setSelectedListing(null); // Close sidebar details smoothly
  };

  // Multi-step Application Form State
  const [applyStep, setApplyStep] = useState(1);
  const [coverLetterText, setCoverLetterText] = useState('');
  const [selectedResumeName, setSelectedResumeName] = useState(currentUser?.resumeName || '');

  // Post New Listing Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCompany, setNewCompany] = useState(currentUser?.companyName || 'University Sponsor');
  const [newLocation, setNewLocation] = useState('Remote');
  const [newStipend, setNewStipend] = useState('$40 / hr');
  const [newDeadline, setNewDeadline] = useState('June 30, 2026');
  const [newCategory, setNewCategory] = useState<'Engineering' | 'Design' | 'Product' | 'Marketing'>('Engineering');
  const [newDescription, setNewDescription] = useState('');
  const [newRequirements, setNewRequirements] = useState('');
  const [newSkills, setNewSkills] = useState('');
  const [listingReviewRemarkDraft, setListingReviewRemarkDraft] = useState('');

  // Dynamically sync forms once currentUser session loads
  useEffect(() => {
    if (currentUser?.companyName) {
      setNewCompany(currentUser.companyName);
    }
    if (currentUser?.resumeName) {
      setSelectedResumeName(currentUser.resumeName);
    }
  }, [currentUser]);

  // Autofill listing generator
  const handleAutofill = () => {
    const mockJobs = [
      {
        title: 'Full Stack Engineer Intern',
        company: 'Vercel',
        category: 'Engineering' as const,
        location: 'Remote (US/Canada)',
        stipend: '$55 / hr',
        deadline: 'July 15, 2026',
        description: 'We are seeking an outstanding Full Stack Engineering Intern to work on Next.js core features, developer experience tooling, and serverless edge rendering optimizations. You will collaborate closely with frameworks and infrastructure teams.',
        requirements: 'Enrolled in Computer Science or equivalent major\nStrong experience with React, TypeScript, and Node.js\nFamiliarity with serverless and edge compute paradigms\nGreat communication and problem-solving skills',
        skills: 'React, Next.js, TypeScript, Node.js, WebAssembly'
      },
      {
        title: 'Interaction Designer Intern',
        company: 'Linear',
        category: 'Design' as const,
        location: 'Hybrid (San Francisco, CA)',
        stipend: '$5,500 / mo',
        deadline: 'July 20, 2026',
        description: 'Help shape the future of issue tracking. As a design intern at Linear, you will work on crafting high-fidelity layouts, advanced SVG keyboard navigations, and fluid interface micro-animations that make work feel like play.',
        requirements: 'Comprehensive portfolio showcasing elegant product UI design\nStrong proficiency in Figma and prototyping tools\nDeep appreciation for typography, space, grids, and aesthetics\nFamiliarity with frontend technologies is a plus',
        skills: 'Figma, UI/UX, Motion Design, Prototyping'
      },
      {
        title: 'Technical Product Manager Intern',
        company: 'Stripe',
        category: 'Product' as const,
        location: 'Remote (Global)',
        stipend: '$6,500 / mo',
        deadline: 'July 25, 2026',
        description: 'Join the Stripe developer experience team. You will lead telemetry research, draft developer product PRDs, coordinate API design sprint structures, and design payment checkout onboarding funnels.',
        requirements: 'Technical background (CS or software engineering projects)\nExcellent analytical and data metrics synthesis skills\nEmpathetic mindset for developer tooling and pain-points\nStrong collaborative narrative writing',
        skills: 'Product Planning, SQL, Developer APIs, Funnel Analytics'
      }
    ];

    const randomJob = mockJobs[Math.floor(Math.random() * mockJobs.length)];
    setNewTitle(randomJob.title);
    setNewCompany(currentUser?.companyName || randomJob.company);
    setNewCategory(randomJob.category);
    setNewLocation(randomJob.location);
    setNewStipend(randomJob.stipend);
    setNewDeadline(randomJob.deadline);
    setNewDescription(randomJob.description);
    setNewRequirements(randomJob.requirements);
    setNewSkills(randomJob.skills);

    triggerToast('Form Autofilled', `Populated the form with a mockup listing for ${randomJob.company}!`, 'info');
  };

  // Filtering Logic
  const categories = ['All', 'Engineering', 'Design', 'Product', 'Marketing'];

  const filteredListings = internships.filter(listing => {
    const matchesCategory = selectedCategory === 'All' || listing.category === selectedCategory;
    const matchesSearch = 
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Switch filter from sidebar or helper buttons
    if (listingsFilter === 'my_company' && currentRole === 'Company') {
      return matchesCategory && matchesSearch && listing.company.toLowerCase() === (currentUser.companyName || 'Linear').toLowerCase();
    }

    return matchesCategory && matchesSearch;
  });

  // Check if student has already applied to a listing
  const hasApplied = (listingId: string) => {
    if (!currentUser) return false;
    return applications.some(a => a.studentId === currentUser.id && a.internshipId === listingId);
  };

  // Submit Application Integration
  const handleApplySubmit = () => {
    if (!selectedListing) return;
    onApply(selectedListing.id, coverLetterText, selectedResumeName);
    setIsApplyModalOpen(false);
    setApplyStep(1);
    setCoverLetterText('');
    setSelectedListing(null);
  };

  // Submit Post Integration
  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDescription) {
      triggerToast('Incomplete fields', 'Please enter a title & listing description.', 'error');
      return;
    }

    const reqsArray = newRequirements
      ? newRequirements.split('\n').filter(r => r.trim() !== '')
      : ['Prior experience in relevant technology stack', 'Excellent communicative and writing abilities'];

    const skillsArray = newSkills
      ? newSkills.split(',').map(s => s.trim()).filter(s => s !== '')
      : ['TypeScript', 'Team Collaboration'];

    // Generate random background pastel gradients
    const logoColors = [
      'bg-[#0f4c5c] text-white',
      'bg-slate-900 text-white',
      'bg-emerald-800 text-white',
      'bg-[#235a64] text-white',
      'bg-zinc-850 text-white font-mono'
    ];
    const randomLogoBg = logoColors[Math.floor(Math.random() * logoColors.length)];

    const newListingItem: Internship = {
      id: `intern-${Date.now()}`,
      title: newTitle,
      company: newCompany,
      location: newLocation,
      stipend: newStipend,
      deadline: newDeadline,
      description: newDescription,
      requirements: reqsArray,
      skills: skillsArray,
      category: newCategory,
      logoBg: randomLogoBg,
      postedDate: 'Today'
    };

    onAddListing(newListingItem);
    setIsPostModalOpen(false);
    
    // Reset Form
    setNewTitle('');
    setNewDescription('');
    setNewRequirements('');
    setNewSkills('');
  };

  return (
    <div className="space-y-6 fade-in-up">
      
      {/* Search and Action Bar */}
      <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between border-b border-[#F1F0EC] pb-5">
        <div className="flex-1 max-w-lg relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            id="listings-search-input"
            type="text"
            placeholder="Search roles, skill keywords, or enterprise companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-[#E5E2DE] focus:border-editorial-light focus:ring-1 focus:ring-editorial-light rounded-xl text-xs placeholder:text-[#94A3B8] transition-colors font-sans text-[#1A1C1E]"
          />
        </div>

        {/* Category Pill Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              id={`category-filter-${cat}`}
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all border ${
                selectedCategory === cat
                  ? 'bg-editorial text-white border-editorial'
                  : 'bg-white border-[#E5E2DE] text-[#64748B] hover:text-[#1A1C1E] hover:border-editorial-light'
              }`}
            >
              {cat}
            </button>
          ))}

          {/* Recruiter "Post" Shortcut */}
          {(currentRole === 'Company' || currentRole === 'Admin') && (
            <button
              id="post-listing-trigger"
              onClick={() => setIsPostModalOpen(true)}
              className="ml-2 px-4 py-1.5 bg-editorial text-white border border-editorial rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-editorial-light cursor-pointer shadow-sm ml-auto md:ml-2 transition-all"
            >
              <Plus size={14} />
              <span>Post Listing</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid & Side Detail split (Asymmetric Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Internship listings list (8 grid cols if detail open, 12 if closed) */}
        <div className={`${selectedListing ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-4`}>
          {filteredListings.length === 0 ? (
            <div className="bg-white border border-[#E5E2DE] rounded-2xl p-12 text-center max-w-xl mx-auto">
              <Info size={32} className="mx-auto text-[#94A3B8] mb-3" />
              <h3 className="font-serif font-semibold text-lg text-editorial">No internships match filters</h3>
              <p className="text-xs text-[#64748B] max-w-md mx-auto mt-2.5 leading-relaxed">
                Check other skill tags or switch your filter context at the top to display alternative categories.
              </p>
              <button
                id="reset-listings-query-btn"
                onClick={() => {setSelectedCategory('All'); setSearchQuery('');}}
                className="mt-4 text-xs font-bold text-editorial-light hover:bg-[#F9F8F6] hover:underline cursor-pointer border border-[#E5E2DE] px-3.5 py-1.5 rounded-lg"
              >
                Reset Search
              </button>
            </div>
          ) : (
            <div className={`grid grid-cols-1 ${selectedListing ? 'md:grid-cols-1' : 'md:grid-cols-2 xl:grid-cols-3'} gap-4`}>
              {filteredListings.map((listing) => {
                const alreadyApplied = hasApplied(listing.id);
                const isSelected = selectedListing?.id === listing.id;

                return (
                  <div
                    key={listing.id}
                    id={`internship-card-${listing.id}`}
                    onClick={() => setSelectedListing(listing)}
                    className={`bg-white border rounded-2xl p-5 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group ${
                      isSelected 
                        ? 'border-editorial-light ring-1 ring-editorial-light' 
                        : 'border-[#E5E2DE] hover:border-editorial-light/40'
                    }`}
                  >
                    <div>
                      {/* Logo header */}
                      <div className="flex items-start justify-between pb-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 shrink-0 rounded-lg flex items-center justify-center font-serif text-sm font-semibold shadow-inner ${listing.logoBg}`}>
                            {listing.company.charAt(0)}
                          </div>
                          <div>
                            <span className="text-[10px] font-mono text-[#94A3B8] uppercase tracking-widest leading-none">
                              {listing.company}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="inline-block h-1.5 w-1.5 bg-editorial-light rounded-full" />
                              <span className="text-[10px] text-[#64748B] font-mono italic">{listing.category}</span>
                            </div>
                          </div>
                        </div>

                        {alreadyApplied && (
                          <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase font-mono px-1.5 py-0.5 rounded font-bold">
                            Applied
                          </span>
                        )}
                      </div>

                      {/* Content Body */}
                      <h4 className="font-serif font-semibold text-base text-[#1A1C1E] leading-snug group-hover:text-editorial-light transition-all mt-2">
                        {listing.title}
                      </h4>
                      
                      <p className="text-xs text-[#64748B] line-clamp-3 mt-2 font-sans leading-relaxed">
                        {listing.description}
                      </p>

                      {/* Metrics section */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4 pt-3.5 border-t border-dashed border-[#F1F0EC] text-[11px] text-[#64748B]">
                        <div className="flex items-center gap-1">
                          <MapPin size={12} className="text-[#94A3B8]" />
                          <span className="truncate max-w-[120px]">{listing.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign size={12} className="text-[#94A3B8]" />
                          <span>{listing.stipend}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between">
                      {/* Skills list */}
                      <div className="flex flex-wrap gap-1 max-w-[50%]">
                        {listing.skills.slice(0, 2).map(skill => (
                          <span key={skill} className="text-[9px] bg-[#F9F8F6] border border-[#E5E2DE] text-[#64748B] px-1.5 py-0.5 rounded font-mono">
                            {skill}
                          </span>
                        ))}
                        {listing.skills.length > 2 && (
                          <span className="text-[9px] text-[#94A3B8] font-mono px-1">+{listing.skills.length - 2}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {!currentUser ? (
                          <button
                            title="Sign in to apply to internships"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onPromptAuth) onPromptAuth();
                            }}
                            className="px-2.5 py-1.5 bg-[#0D9488]/10 hover:bg-editorial-light text-editorial-light hover:text-white border border-transparent rounded-lg text-[10px] font-bold cursor-pointer transition-all shadow-xs"
                          >
                            Sign In to Apply
                          </button>
                        ) : (
                          currentRole === 'Student' && !alreadyApplied && (
                            <button
                              title="Instant One-Click Apply"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickApply(listing);
                              }}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 hover:border-transparent rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                            >
                              <Sparkles size={11} />
                              <span>Quick Apply</span>
                            </button>
                          )
                        )}
                        <span className="text-xs text-editorial-light font-bold group-hover:translate-x-1.5 transition-transform flex items-center gap-0.5">
                          Details
                          <ArrowRight size={12} />
                        </span>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Editorial Detail Panel (4 grid cols, sliding layout) */}
        {selectedListing && (
          <div className="lg:col-span-5 bg-white border border-[#E5E2DE] rounded-2xl p-6 shadow-lg space-y-6 shrink-0 relative animate-fadeInUp">
            
            {/* Close detail button */}
            <button
              id="close-listing-details-btn"
              onClick={() => setSelectedListing(null)}
              className="absolute top-4 right-4 p-1 rounded-full text-[#94A3B8] hover:text-[#1A1C1E] hover:bg-[#F9F8F6] transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>

            {/* Premium Header */}
            <div className="flex items-center gap-4 border-b border-[#F1F0EC] pb-5">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-serif text-base font-bold shadow-md ${selectedListing.logoBg}`}>
                {selectedListing.company.charAt(0)}
              </div>
              <div>
                <span className="text-[10px] font-mono tracking-widest text-[#94A3B8] uppercase">
                  {selectedListing.company}
                </span>
                <h3 className="font-serif font-semibold text-lg text-editorial leading-tight mt-0.5">
                  {selectedListing.title}
                </h3>
              </div>
            </div>

            {/* Quick specifications table */}
            <div className="grid grid-cols-2 gap-4 bg-[#F9F8F6] p-3.5 rounded-xl border border-[#E5E2DE]">
              <div className="space-y-0.5 text-left">
                <span className="text-[9px] font-mono text-[#94A3B8] uppercase">Location Strategy</span>
                <p className="text-xs font-semibold text-[#1A1C1E] flex items-center gap-1">
                  <MapPin size={12} className="text-[#94A3B8]" />
                  {selectedListing.location}
                </p>
              </div>
              <div className="space-y-0.5 text-left">
                <span className="text-[9px] font-mono text-[#94A3B8] uppercase">Hourly Stipend</span>
                <p className="text-xs font-semibold text-[#1A1C1E] flex items-center gap-1">
                  <DollarSign size={12} className="text-[#94A3B8]" />
                  {selectedListing.stipend}
                </p>
              </div>
              <div className="space-y-0.5 text-left">
                <span className="text-[9px] font-mono text-[#94A3B8] uppercase">Closing Date</span>
                <p className="text-xs font-semibold text-[#1A1C1E] flex items-center gap-1">
                  <Calendar size={12} className="text-amber-500" />
                  {selectedListing.deadline}
                </p>
              </div>
              <div className="space-y-0.5 text-left">
                <span className="text-[9px] font-mono text-[#94A3B8] uppercase">Department</span>
                <p className="text-xs font-semibold text-editorial-light">
                  {selectedListing.category} (Division)
                </p>
              </div>
            </div>

            {/* About the role */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono uppercase tracking-widest text-[#94A3B8] font-bold">About the role</h4>
              <p className="text-xs text-gray-600 leading-relaxed font-sans">
                {selectedListing.description}
              </p>
            </div>

            {/* Ideal Candidate Requirements list */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-mono uppercase tracking-widest text-[#94A3B8] font-bold">Prerequisites</h4>
              <ul className="space-y-1.5">
                {selectedListing.requirements.map((req, idx) => (
                  <li key={idx} className="text-xs text-[#64748B] flex items-start gap-2 leading-relaxed">
                    <span className="text-editorial-light font-bold mt-1 shrink-0">GÇó</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Associated technologies */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono uppercase tracking-widest text-[#94A3B8] font-bold">Expected Tech Stacks</h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedListing.skills.map(skill => (
                  <span key={skill} className="text-xs bg-[#F9F8F6] text-editorial-light px-2.5 py-1 rounded-md font-mono border border-[#E5E2DE]">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {currentRole === 'Faculty' && (
              <div className="space-y-2.5 pt-4 border-t border-[#F1F0EC]">
                <h4 className="text-xs font-mono uppercase tracking-widest text-[#94A3B8] font-bold">Faculty Listing Verification</h4>
                <p className="text-xs text-[#64748B]">
                  Current status: <span className="font-semibold">{selectedListing.facultyApprovalStatus || 'Pending'}</span>
                </p>
                {(selectedListing.facultyApprovalStatus || 'Pending') === 'Unverified' && selectedListing.facultyApprovalRemark && (
                  <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded p-2">
                    Remark: {selectedListing.facultyApprovalRemark}
                  </p>
                )}
                <textarea
                  rows={2}
                  value={listingReviewRemarkDraft}
                  onChange={(e) => setListingReviewRemarkDraft(e.target.value)}
                  placeholder="Add remark when rejecting listing"
                  className="w-full text-xs font-sans p-2 rounded-lg bg-white border border-[#ecece0] resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => onFacultyReviewListing?.(selectedListing.id, 'Verified')}
                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 cursor-pointer"
                    disabled={applications.some((a) => a.internshipId === selectedListing.id)}
                  >
                    Verify Listing
                  </button>
                  <button
                    onClick={() => {
                      if (!listingReviewRemarkDraft.trim()) {
                        triggerToast('Remark Required', 'Please add remark before rejecting listing.', 'error');
                        return;
                      }
                      onFacultyReviewListing?.(selectedListing.id, 'Unverified', listingReviewRemarkDraft);
                    }}
                    className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 cursor-pointer"
                    disabled={applications.some((a) => a.internshipId === selectedListing.id)}
                  >
                    Mark Unverified
                  </button>
                </div>
                {applications.some((a) => a.internshipId === selectedListing.id) && (
                  <p className="text-[11px] text-[#64748B] italic">
                    Verification is only required before hiring starts. This opening already has active applications.
                  </p>
                )}
                <div className="space-y-2 pt-2 border-t border-[#E5E2DE]">
                  <p className="text-xs font-semibold text-editorial">Company Authenticity Check</p>
                  {allUsers
                    .filter(
                      (u) =>
                        u.role === 'Company' &&
                        (u.companyName || '').toLowerCase() === selectedListing.company.toLowerCase()
                    )
                    .map((recruiter) => (
                      <div key={recruiter.id} className="p-2.5 bg-white border border-[#E5E2DE] rounded-lg space-y-2">
                        <p className="text-xs font-semibold text-[#1A1C1E]">
                          {recruiter.name} ({recruiter.companyName})
                        </p>
                        <p className="text-[11px] text-[#64748B]">
                          Recruiter status: {recruiter.recruiterVerificationStatus || 'Pending'}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => onFacultyVerifyRecruiter?.(recruiter.id, 'Genuine')}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded text-[11px] font-semibold hover:bg-emerald-700"
                          >
                            Mark Genuine
                          </button>
                          <button
                            onClick={() => {
                              if (!listingReviewRemarkDraft.trim()) {
                                triggerToast('Reason Required', 'Add reason before marking recruiter not genuine.', 'error');
                                return;
                              }
                              onFacultyVerifyRecruiter?.(recruiter.id, 'Not Genuine', listingReviewRemarkDraft);
                            }}
                            className="px-2.5 py-1 bg-rose-600 text-white rounded text-[11px] font-semibold hover:bg-rose-700"
                          >
                            Mark Not Genuine
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Vetted Candidates list (Visible only to listings owner recruiters or admins) */}
            {(currentRole === 'Admin' || (currentRole === 'Company' && currentUser?.companyName?.toLowerCase() === selectedListing.company.toLowerCase())) && (
              <div className="space-y-3 pt-4 border-t border-[#F1F0EC]">
                <h4 className="text-xs font-mono uppercase tracking-widest text-[#94A3B8] font-bold flex justify-between">
                  <span>Vetted Candidates ({applications.filter(a => a.internshipId === selectedListing.id).length})</span>
                  <span className="text-editorial-light font-sans normal-case font-semibold">Real-time status</span>
                </h4>
                
                {applications.filter(a => a.internshipId === selectedListing.id).length === 0 ? (
                  <p className="text-xs text-gray-500 italic pr-2 text-left">No student applicants have registered dossiers for this listing yet.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {applications.filter(a => a.internshipId === selectedListing.id).map((app) => (
                      <div key={app.id} className="p-2.5 bg-[#F9F8F6] border border-[#E5E2DE] rounded-xl flex items-center justify-between hover:border-editorial-light/40 transition-colors">
                        <div className="text-left">
                          <p className="text-xs font-bold text-text-main leading-tight">{app.studentName}</p>
                          <p className="text-[10px] text-text-muted mt-0.5">{app.studentCollege} GÇó {app.studentEmail}</p>
                        </div>
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold border ${
                          app.status === 'Offer' ? 'bg-emerald-50 text-emerald-700 border-emerald-250' :
                          app.status === 'Interview' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          app.status === 'Shortlisted' ? 'bg-teal-50 text-teal-850 border-teal-200' :
                          app.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-gray-50 text-gray-750 border-gray-200'
                        }`}>
                          {app.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Primary Action Button (Apply Modal Trigger) */}
            <div className="pt-4 border-t border-[#F1F0EC] flex flex-col sm:flex-row gap-2.5 items-center justify-between w-full">
              {!currentUser ? (
                <button
                  onClick={() => {
                    if (onPromptAuth) onPromptAuth();
                  }}
                  className="w-full py-2.5 bg-editorial text-white hover:bg-editorial-light rounded-xl text-xs font-bold text-center cursor-pointer shadow transition-all flex items-center justify-center gap-1.5"
                >
                  <Sparkles size={13} className="animate-pulse" />
                  Sign In to Apply Now
                </button>
              ) : currentRole === 'Student' ? (
                hasApplied(selectedListing.id) ? (
                  <button
                    disabled
                    className="w-full py-2.5 bg-[#F9F8F6] text-[#94A3B8] border border-[#E5E2DE] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 select-none"
                  >
                    <Check size={14} />
                    <span>Application Submitted Successfully</span>
                  </button>
                ) : (
                  <>
                    <button
                      id="trigger-quick-apply-btn"
                      onClick={() => handleQuickApply(selectedListing)}
                      className="w-full sm:w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold text-center cursor-pointer shadow transition-all flex items-center justify-center gap-1.5"
                    >
                      <Sparkles size={13} className="animate-pulse" />
                      One-Click Apply
                    </button>
                    <button
                      id="trigger-apply-now-btn"
                      onClick={() => {
                        setIsApplyModalOpen(true);
                        setApplyStep(1);
                      }}
                      className="w-full sm:w-1/2 py-2.5 bg-editorial text-white rounded-xl text-xs font-bold text-center hover:bg-editorial-light cursor-pointer shadow transition-all flex items-center justify-center gap-1"
                    >
                      Standard Apply <ChevronRight size={14} />
                    </button>
                  </>
                )
              ) : (
                (currentRole === 'Admin' || (currentRole === 'Company' && currentUser?.companyName?.toLowerCase() === selectedListing.company.toLowerCase())) ? (
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to close and delete this internship opportunity? This action is permanent.')) {
                        onDeleteListing(selectedListing.id);
                        setSelectedListing(null); // Close sidebar smoothly
                      }
                    }}
                    className="w-full py-2.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 hover:border-transparent rounded-xl text-xs font-bold text-center cursor-pointer transition-all shadow-xs flex items-center justify-center gap-1.5"
                  >
                    Close & Delete Listing
                  </button>
                ) : (
                  <div className="p-3 bg-[#F9F8F6] rounded-xl text-[11px] text-[#64748B] font-sans w-full text-center italic border border-[#E5E2DE]">
                    Viewing in {currentRole} recruiter mode. Candidate credentials apply here.
                  </div>
                )
              )}
            </div>

          </div>
        )}
      </div>

      {/* MULTI_STEP APPLICATION MODAL */}
      {isApplyModalOpen && selectedListing && createPortal(
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-cream-bg rounded-2xl max-w-xl w-full p-6 shadow-xl border border-[#ecece0] relative animate-fadeInUp">
            
            <button
              id="cancel-apply-modal"
              onClick={() => setIsApplyModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:text-editorial hover:bg-cream-accent transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            {/* Step trackers */}
            <div className="flex items-center gap-2 mb-6">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex-1 flex items-center gap-1">
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-mono leading-none ${
                    applyStep === step 
                      ? 'bg-editorial text-white font-bold' 
                      : applyStep > step 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-cream-accent text-gray-400'
                  }`}>
                    {applyStep > step ? <Check size={10} /> : step}
                  </div>
                  <span className={`text-[10px] font-mono uppercase tracking-wider hidden sm:inline ${
                    applyStep === step ? 'text-editorial font-bold' : 'text-gray-400'
                  }`}>
                    {step === 1 && 'Applicant'}
                    {step === 2 && 'Proposal Pitch'}
                    {step === 3 && 'Double Check'}
                  </span>
                  {step < 3 && <div className="h-px bg-gray-200 flex-1 ml-1" />}
                </div>
              ))}
            </div>

            <div className="border-b border-[#ecece0] pb-4 mb-5">
              <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">
                Multi-step Application Wizard
              </span>
              <h3 className="font-display font-medium text-lg text-editorial">
                Applying to {selectedListing.company}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">{selectedListing.title}</p>
            </div>

            {/* STEPS ROUTING */}
            {applyStep === 1 && currentUser && (
              <div className="space-y-4">
                <div className="p-3 bg-amber-50/15 border border-amber-500/10 rounded-xl flex items-center gap-2.5">
                  <UserCheck size={16} className="text-editorial" />
                  <p className="text-xs text-gray-600 leading-normal">
                    We will fetch your verified profile attributes automatically to speed up recruiter vetting. Update them anytime in <strong>My Documents</strong>.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono tracking-wider text-gray-400">Student Applicant</label>
                    <input type="text" disabled value={currentUser.name} className="w-full bg-cream-accent border border-[#ecece0] px-3.5 py-2 rounded-lg text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono tracking-wider text-gray-400">University Email</label>
                    <input type="text" disabled value={currentUser.email} className="w-full bg-cream-accent border border-[#ecece0] px-3.5 py-2 rounded-lg text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono tracking-wider text-gray-400">Current College</label>
                    <input type="text" disabled value={currentUser.college || 'Stanford University'} className="w-full bg-cream-accent border border-[#ecece0] px-3.5 py-2 rounded-lg text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono tracking-wider text-gray-400">Graduation Year</label>
                    <input type="text" disabled value={currentUser.graduationYear || '2027'} className="w-full bg-cream-accent border border-[#ecece0] px-3.5 py-2 rounded-lg text-xs" />
                  </div>
                </div>
              </div>
            )}

            {applyStep === 2 && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-gray-400 flex justify-between">
                    <span>Introduce Your Competencies (Pitch)</span>
                    <span className="text-gray-400 normal-case">Minimum 20 words recommended</span>
                  </label>
                  <textarea
                    id="apply-coverletter-input"
                    rows={5}
                    value={coverLetterText}
                    onChange={(e) => setCoverLetterText(e.target.value)}
                    placeholder="Describe you, your projects, why you are a fit, and when you can start..."
                    className="w-full bg-page-bg border border-[#ecece0] rounded-xl p-3.5 text-xs font-sans leading-relaxed resize-none"
                  />
                </div>
              </div>
            )}

            {applyStep === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-gray-400">Select Resume File</label>
                  <div className="p-3 bg-page-bg border border-editorial border-dashed rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <FileText className="text-editorial" size={18} />
                      <div className="text-left">
                        <p className="text-xs font-semibold text-gray-800">{selectedResumeName}</p>
                        <p className="text-[10px] text-gray-400 font-mono">Adobe PDF GÇó Auto attached</p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 py-0.5 px-2 rounded uppercase font-mono font-bold">
                      Verified
                    </span>
                  </div>
                </div>

                <div className="bg-cream-accent/40 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Organization:</span>
                    <span className="font-semibold text-gray-800">{selectedListing.company}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Role Applied:</span>
                    <span className="font-semibold text-gray-800">{selectedListing.title}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Estimated Pay:</span>
                    <span className="font-semibold text-editorial font-mono">{selectedListing.stipend}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <input id="certify-checklist" type="checkbox" defaultChecked className="mt-0.5 cursor-pointer accent-editorial h-4 w-4" />
                  <span className="text-xs text-gray-500 leading-normal">
                    I state that all information provided represents true academic status. Incipio portal manages submission dispatch safely.
                  </span>
                </div>
              </div>
            )}

            {/* BUTTON CONTROLS */}
            <div className="flex items-center justify-between pt-6 border-t border-[#ecece0] mt-6">
              {applyStep > 1 ? (
                <button
                  id="apply-modal-back-btn"
                  onClick={() => setApplyStep(applyStep - 1)}
                  className="px-4 py-2 bg-cream-accent hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Back Step
                </button>
              ) : (
                <div />
              )}

              {applyStep < 3 ? (
                <button
                  id="apply-modal-next-btn"
                  onClick={() => {
                    if (applyStep === 2 && coverLetterText.trim().length === 0) {
                      triggerToast('Pitch Required', 'Please author a quick pitch before clicking continue.', 'error');
                      return;
                    }
                    setApplyStep(applyStep + 1);
                  }}
                  className="px-5 py-2 bg-editorial hover:bg-editorial-light text-white rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 shadow"
                >
                  Continue <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  id="apply-modal-submit-btn"
                  onClick={handleApplySubmit}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 shadow"
                >
                  Submit Final Portfolio <Check size={14} />
                </button>
              )}
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* POST NEW LISTING MODAL (RECRUITER/ADMIN ONLY) */}
      {isPostModalOpen && createPortal(
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-cream-bg rounded-2xl max-w-xl w-full p-6 shadow-xl border border-[#ecece0] relative overflow-y-auto max-h-[90vh]">
            
            <button
              id="cancel-post-modal"
              onClick={() => setIsPostModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:text-editorial hover:bg-cream-accent transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            <form onSubmit={handlePostSubmit} className="space-y-4">
              <div className="border-b border-[#ecece0] pb-3 mb-4">
                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest flex items-center gap-1">
                  <Award size={12} className="text-editorial" /> Post Opportunity Listings
                </span>
                <h3 className="font-display font-medium text-lg text-editorial">
                  Publish New Internship Listing
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Your listing will be sent for faculty verification before student visibility.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-gray-400">Listing Title *</label>
                  <input
                    id="post-title-input"
                    type="text"
                    required
                    placeholder="e.g. Senior Backend Associate"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-page-bg border border-[#ecece0] px-3.5 py-2 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-gray-400">Publishing Entity (Company)</label>
                  <input
                    id="post-company-input"
                    type="text"
                    required
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    className="w-full bg-cream-accent border border-[#ecece0] px-3.5 py-2 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-gray-400">Class Base (Category)</label>
                  <select
                    id="post-category-select"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-page-bg border border-[#ecece0] px-3.5 py-2 rounded-lg text-xs"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Design">Design</option>
                    <option value="Product">Product</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-gray-400">Geographic Strategy *</label>
                  <input
                    id="post-location-input"
                    type="text"
                    required
                    placeholder="e.g. SF, Tokyo, Remote"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full bg-page-bg border border-[#ecece0] px-3.5 py-2 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-gray-400">Salary / Stipend Rate *</label>
                  <input
                    id="post-stipend-input"
                    type="text"
                    required
                    placeholder="e.g. $45 / hr or $5,000 / mo"
                    value={newStipend}
                    onChange={(e) => setNewStipend(e.target.value)}
                    className="w-full bg-page-bg border border-[#ecece0] px-3.5 py-2 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-gray-400">Portal Closing Date *</label>
                  <input
                    id="post-deadline-input"
                    type="text"
                    required
                    placeholder="e.g. June 30, 2026"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full bg-page-bg border border-[#ecece0] px-3.5 py-2 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-wider text-gray-400">Primary Job Description *</label>
                <textarea
                  id="post-description-input"
                  required
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Summarize the core day to day projects, mentorship opportunities and stack values..."
                  className="w-full bg-page-bg border border-[#ecece0] rounded-lg p-3 text-xs font-sans resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-wider text-gray-400">Prerequisites (One line each)</label>
                <textarea
                  id="post-requirements-input"
                  rows={2}
                  value={newRequirements}
                  onChange={(e) => setNewRequirements(e.target.value)}
                  placeholder="Enrolled in a Technical major&#10;Prior experience with databases&#10;Excellent communication structure"
                  className="w-full bg-page-bg border border-[#ecece0] rounded-lg p-3 text-xs font-sans resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-wider text-gray-400">Keywords & Tags (Comma Separated)</label>
                <input
                  id="post-skills-input"
                  type="text"
                  placeholder="React, CSS, SQL, Figma"
                  value={newSkills}
                  onChange={(e) => setNewSkills(e.target.value)}
                  className="w-full bg-page-bg border border-[#ecece0] px-3.5 py-2 rounded-lg text-xs"
                />
              </div>

              <div className="flex gap-3 justify-between items-center pt-4 border-t border-[#ecece0] mt-4">
                <button
                  type="button"
                  id="post-modal-autofill-btn"
                  onClick={handleAutofill}
                  className="px-3.5 py-2 bg-brand-50 hover:bg-brand-100 text-editorial-light border border-brand-100 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Sparkles size={13} className="animate-spin" style={{ animationDuration: '4s' }} />
                  Autofill Mock Data
                </button>
                <div className="flex gap-3">
                  <button
                    type="button"
                    id="post-modal-cancel-btn"
                    onClick={() => setIsPostModalOpen(false)}
                    className="px-4 py-2 bg-cream-accent hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    id="post-modal-submit-btn"
                    className="px-5 py-2 bg-editorial hover:bg-editorial-light text-white rounded-lg text-xs font-semibold cursor-pointer shadow flex items-center gap-1"
                  >
                    Launch Listing <Check size={14} />
                  </button>
                </div>
              </div>
            </form>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
}

