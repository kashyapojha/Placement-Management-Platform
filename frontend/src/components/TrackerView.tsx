import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Columns, 
  Table as TableIcon, 
  MapPin, 
  Calendar, 
  ArrowRight, 
  ExternalLink,
  ChevronRight,
  FileCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  User,
  Inbox,
  Sparkles,
  ChevronDown,
  Edit,
  X,
  Github,
  Linkedin,
  Twitter
} from 'lucide-react';
import { UserRole, UserProfile, Application, Internship } from '../types';

interface TrackerViewProps {
  currentRole: UserRole;
  currentUser: UserProfile;
  applications: Application[];
  internships: Internship[];
  allUsers: UserProfile[];
  onUpdateStatus: (appId: string, newStatus: Application['status'], offerDetails?: string) => void;
  onFacultyVerifyApplication: (appId: string, status: 'Verified' | 'Unverified', reason?: string) => void;
  onFacultyVerifyRecruiter: (recruiterId: string, status: 'Genuine' | 'Not Genuine', reason?: string) => void;
  onFacultyVerifyStudentProfile: (studentId: string, status: 'Verified' | 'Unverified', remark?: string) => void;
  onFacultyReviewListing: (listingId: string, status: 'Verified' | 'Unverified', remark?: string) => void;
  triggerToast: (title: string, text: string, type: 'success' | 'info' | 'error') => void;
}

export default function TrackerView({
  currentRole,
  currentUser,
  applications,
  internships,
  allUsers,
  onUpdateStatus,
  onFacultyVerifyApplication,
  onFacultyVerifyRecruiter,
  onFacultyVerifyStudentProfile,
  onFacultyReviewListing,
  triggerToast
}: TrackerViewProps) {

  // Dashboard Toggle state: "kanban" vs "list"
  const [viewType, setViewType] = useState<'kanban' | 'table'>('kanban');

  // Selected Application for Detail Modal
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  // Recruiter action form state
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [statusDraft, setStatusDraft] = useState<Application['status']>('Applied');
  const [offerTextDraft, setOfferTextDraft] = useState('');
  const [facultyReasonDraft, setFacultyReasonDraft] = useState('');
  const [recruiterReasonDraft, setRecruiterReasonDraft] = useState('');
  const [studentRemarkDraft, setStudentRemarkDraft] = useState('');
  const [listingRemarkDraft, setListingRemarkDraft] = useState('');

  const selectedAppProfile = selectedApp ? allUsers.find(u => u.id === selectedApp.studentId) : null;
  const pendingCompanyVerificationListings = internships.filter((listing) => {
    const listingApplicationsCount = applications.filter((a) => a.internshipId === listing.id).length;
    return listingApplicationsCount === 0 && (listing.facultyApprovalStatus || 'Pending') === 'Pending';
  });

  // Settle user data scope
  const getFilteredApps = () => {
    if (currentRole === 'Student') {
      return applications.filter(a => a.studentId === currentUser.id);
    } else if (currentRole === 'Company') {
      const companyKey = (currentUser.companyName || 'Linear').toLowerCase();
      return applications.filter(a => a.companyName && a.companyName.toLowerCase() === companyKey);
    } else if (currentRole === 'Faculty') {
      return applications;
    }
    // Admin sees everything
    return applications;
  };

  const visibleApps = getFilteredApps();

  const statuses: Application['status'][] = ['Applied', 'Shortlisted', 'Interview', 'Offer', 'Rejected'];

  const getStatusStyle = (status: Application['status']) => {
    switch (status) {
      case 'Applied': return 'bg-zinc-100 text-zinc-700 border-zinc-200';
      case 'Shortlisted': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Interview': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Offer': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Rejected': return 'bg-rose-50 text-rose-700 border-rose-250';
    }
  };

  // Student accepts/declines formal offers
  const handleStudentOfferAction = (app: Application, action: 'accept' | 'decline') => {
    if (action === 'accept') {
      triggerToast(
        'Congratulations!',
        `You have officially signed and accepted the offer at ${app.companyName}!`,
        'success'
      );
      // Close detail view
      setSelectedApp(null);
    } else {
      onUpdateStatus(app.id, 'Rejected', 'Offer declined by applicant.');
      triggerToast('Offer Declined', 'You have declined the position.', 'info');
      setSelectedApp(null);
    }
  };

  // Recruiter updates status
  const handleUpdateStatusSubmit = (appId: string) => {
    onUpdateStatus(appId, statusDraft, statusDraft === 'Offer' ? offerTextDraft : undefined);
    setEditingAppId(null);
    setOfferTextDraft('');
  };

  return (
    <div className="space-y-6 fade-in-up">
      
      {/* Editorial Navigation Headers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F1F0EC] pb-5">
        <div>
          <div className="flex items-center gap-1.5 text-[#94A3B8] font-mono text-[11px] uppercase tracking-widest mb-1.5">
            <Sparkles size={11} className="text-editorial-light" />
            <span>Interactive Applicant board</span>
          </div>
          <h1 className="text-2xl font-serif font-semibold text-editorial tracking-tight">
            {currentRole === 'Student' && 'My Application Journey'}
            {currentRole === 'Company' && `${currentUser.companyName} Recruitment Pipeline`}
            {currentRole === 'Admin' && 'Global Career Pipelines Audit'}
            {currentRole === 'Faculty' && 'Faculty Verification Desk'}
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">
            Toggle views to organize and audit career pathways. 
            {currentRole === 'Company' && ' Click applications to short-list candidates and dispatch formal offer letters.'}
          </p>
        </div>

        {/* Kanban vs Table Toggle controls */}
        <div className="flex items-center bg-[#F9F8F6] p-1 rounded-xl border border-[#E5E2DE] self-start sm:self-auto shrink-0 select-none">
          <button
            id="tracker-toggle-kanban"
            onClick={() => setViewType('kanban')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
              viewType === 'kanban' 
                ? 'bg-editorial text-white shadow-sm' 
                : 'text-[#64748B] hover:text-editorial'
            }`}
          >
            <Columns size={13} />
            <span>Kanban Board</span>
          </button>
          <button
            id="tracker-toggle-table"
            onClick={() => setViewType('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
              viewType === 'table' 
                ? 'bg-editorial text-white shadow-sm' 
                : 'text-[#64748B] hover:text-editorial'
            }`}
          >
            <TableIcon size={13} />
            <span>Audit Table</span>
          </button>
        </div>
      </div>

      {currentRole === 'Faculty' && (
        <div className="bg-white border border-[#E5E2DE] rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-editorial">Student Profile Verification</h3>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {allUsers.filter((u) => u.role === 'Student').map((student) => (
              <div key={student.id} className="p-3 border border-[#E5E2DE] rounded-xl bg-[#F9F8F6]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-[#1A1C1E]">{student.name}</p>
                    <p className="text-[10px] text-[#64748B]">{student.email}</p>
                    <p className="text-[10px] text-[#64748B]">
                      Status: <span className="font-semibold">{student.studentProfileVerificationStatus || 'Unverified'}</span>
                    </p>
                    {student.studentProfileVerificationStatus === 'Unverified' && student.studentProfileVerificationRemark && (
                      <p className="text-[10px] text-rose-700 mt-1">Remark: {student.studentProfileVerificationRemark}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onFacultyVerifyStudentProfile(student.id, 'Verified')}
                      className="px-2.5 py-1 bg-emerald-600 text-white rounded text-[11px] font-semibold hover:bg-emerald-700"
                    >
                      Verify
                    </button>
                    <button
                      onClick={() => {
                        if (!studentRemarkDraft.trim()) {
                          triggerToast('Remark Required', 'Please add remark before unverify.', 'error');
                          return;
                        }
                        onFacultyVerifyStudentProfile(student.id, 'Unverified', studentRemarkDraft);
                      }}
                      className="px-2.5 py-1 bg-rose-600 text-white rounded text-[11px] font-semibold hover:bg-rose-700"
                    >
                      Unverify
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <textarea
            rows={2}
            value={studentRemarkDraft}
            onChange={(e) => setStudentRemarkDraft(e.target.value)}
            placeholder="Remark to use when marking student profile unverified"
            className="w-full text-xs font-sans p-2 rounded-lg bg-white border border-[#ecece0] resize-none"
          />
        </div>
      )}

      {currentRole === 'Faculty' && (
        <div className="bg-white border border-[#E5E2DE] rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-editorial">Company Job Opening Verification</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {pendingCompanyVerificationListings.map((listing) => {
              const companyRecruiters = allUsers.filter(
                (u) => u.role === 'Company' && (u.companyName || '').toLowerCase() === listing.company.toLowerCase()
              );
              return (
                <div key={listing.id} className="p-3 border border-[#E5E2DE] rounded-xl bg-[#F9F8F6] space-y-2">
                  <p className="text-xs font-semibold text-[#1A1C1E]">
                    {listing.title} - {listing.company}
                  </p>
                  <p className="text-[10px] text-[#64748B]">
                    Listing status: <span className="font-semibold">{listing.facultyApprovalStatus || 'Pending'}</span>
                  </p>
                  {listing.facultyApprovalStatus === 'Unverified' && listing.facultyApprovalRemark && (
                    <p className="text-[10px] text-rose-700">Remark: {listing.facultyApprovalRemark}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => onFacultyReviewListing(listing.id, 'Verified')}
                      className="px-2.5 py-1 bg-emerald-600 text-white rounded text-[11px] font-semibold hover:bg-emerald-700"
                    >
                      Verify Opening
                    </button>
                    <button
                      onClick={() => {
                        if (!listingRemarkDraft.trim()) {
                          triggerToast('Remark Required', 'Add remark before marking opening unverified.', 'error');
                          return;
                        }
                        onFacultyReviewListing(listing.id, 'Unverified', listingRemarkDraft);
                      }}
                      className="px-2.5 py-1 bg-rose-600 text-white rounded text-[11px] font-semibold hover:bg-rose-700"
                    >
                      Unverify Opening
                    </button>
                  </div>
                  {companyRecruiters.map((recruiter) => (
                    <div key={recruiter.id} className="p-2 bg-white border border-[#E5E2DE] rounded-lg">
                      <p className="text-[11px] font-semibold text-[#1A1C1E]">{recruiter.name}</p>
                      <p className="text-[10px] text-[#64748B]">
                        Recruiter status: {recruiter.recruiterVerificationStatus || 'Pending'}
                      </p>
                      <div className="flex gap-2 mt-1.5">
                        <button
                          onClick={() => onFacultyVerifyRecruiter(recruiter.id, 'Genuine')}
                          className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-semibold"
                        >
                          Verify Recruiter
                        </button>
                        <button
                          onClick={() => {
                            if (!listingRemarkDraft.trim()) {
                              triggerToast('Reason Required', 'Add reason before marking recruiter not genuine.', 'error');
                              return;
                            }
                            onFacultyVerifyRecruiter(recruiter.id, 'Not Genuine', listingRemarkDraft);
                          }}
                          className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-semibold"
                        >
                          Unverify Recruiter
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
            {pendingCompanyVerificationListings.length === 0 && (
              <p className="text-xs text-[#64748B] italic">
                No new company openings pending faculty verification.
              </p>
            )}
          </div>
          <textarea
            rows={2}
            value={listingRemarkDraft}
            onChange={(e) => setListingRemarkDraft(e.target.value)}
            placeholder="Remark/reason for unverified opening or recruiter"
            className="w-full text-xs font-sans p-2 rounded-lg bg-white border border-[#ecece0] resize-none"
          />
        </div>
      )}

      {visibleApps.length === 0 ? (
        <div className="bg-white border border-[#E5E2DE] rounded-2xl p-16 text-center max-w-xl mx-auto">
          <Inbox size={36} className="mx-auto text-[#94A3B8] mb-3" />
          <h3 className="font-serif font-semibold text-lg text-editorial">No Active Applications</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto mt-2 leading-relaxed">
            Submit your portfolio cover pitches from the{' '}
            <span className="font-bold underline text-editorial-light cursor-pointer" onClick={() => triggerToast('Hint', 'Click Internships in the sidebar!', 'info')}>
              Internships
            </span>{' '}
            tab to start tracking processes.
          </p>
        </div>
      ) : viewType === 'kanban' ? (
        
        /* KANBAN BOARD VIEW */
        <div id="kanban-scroller" className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {statuses.map((status) => {
            const statusGroupApps = visibleApps.filter(a => a.status === status);
            let colBadge = 'bg-gray-100 text-gray-700';
            if (status === 'Shortlisted') colBadge = 'bg-blue-100 text-blue-800';
            if (status === 'Interview') colBadge = 'bg-amber-100 text-amber-850';
            if (status === 'Offer') colBadge = 'bg-emerald-100 text-emerald-850';
            if (status === 'Rejected') colBadge = 'bg-rose-100 text-rose-800';

            return (
              <div 
                key={status} 
                id={`kanban-col-${status}`}
                className="bg-[#F9F8F6] border border-[#E5E2DE] rounded-2xl p-3.5 space-y-4 min-w-[220px] flex flex-col justify-start"
              >
                {/* Column Headline */}
                <div className="flex items-center justify-between border-b border-[#F1F0EC] pb-2">
                  <span className="text-xs font-bold text-editorial font-serif">{status}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.2 rounded font-bold ${colBadge}`}>
                    {statusGroupApps.length}
                  </span>
                </div>

                {/* Sub Stack of cards */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[70vh]">
                  {statusGroupApps.map((app) => (
                    <div
                      key={app.id}
                      id={`kanban-card-${app.id}`}
                      onClick={() => setSelectedApp(app)}
                      className="bg-white border border-[#E5E2DE] hover:border-editorial-light rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer text-left space-y-3.5 group relative"
                    >
                      <div>
                        {currentRole !== 'Student' && (
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="h-5 w-5 rounded-full bg-editorial-light/10 text-editorial flex items-center justify-center font-serif text-[10px] font-bold">
                              {app.studentName.charAt(0)}
                            </span>
                            <span className="text-[10px] font-semibold text-[#64748B] truncate max-w-[120px]">
                              {app.studentName}
                            </span>
                          </div>
                        )}

                        <span className="text-[9px] font-mono text-[#94A3B8] uppercase tracking-wider block">
                          {app.companyName}
                        </span>
                        <h4 className="font-serif font-semibold text-xs text-editorial leading-tight group-hover:text-editorial-light mt-0.5 transition-colors">
                          {app.internshipTitle}
                        </h4>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-[#94A3B8] font-mono pt-2.5 border-t border-dashed border-[#F1F0EC]">
                        <span className="flex items-center gap-0.5">
                          <Calendar size={10} />
                          {app.dateApplied}
                        </span>
                        
                        {app.status === 'Offer' && (
                          <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 rounded px-1.5 py-0.2">
                            Letter Ready
                          </span>
                        )}
                        {app.status === 'Interview' && (
                          <span className="text-[9px] bg-amber-50 text-amber-700 font-bold border border-amber-200 rounded px-1.5 py-0.2">
                            {app.interviewsCount || 1} Rounds
                          </span>
                        )}
                      </div>
                      {(app.facultyVerificationStatus || 'Pending') !== 'Pending' && (
                        <span className={`inline-block text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                          app.facultyVerificationStatus === 'Verified'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          Faculty: {app.facultyVerificationStatus}
                        </span>
                      )}

                      {/* Floating prompt */}
                      <span className="absolute bottom-2.5 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-editorial-light flex items-center gap-0.5">
                        Inspect <ChevronRight size={10} />
                      </span>
                    </div>
                  ))}
                </div>

              </div>
            );
          })}
        </div>
      ) : (

        /* DETAILED AUDIT TABLE VIEW */
        <div className="bg-white border border-[#E5E2DE] rounded-2xl overflow-hidden shadow-sm" id="audit-table-wrapper">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F9F8F6] border-b border-[#E5E2DE] text-[10px] font-mono text-[#64748B] uppercase tracking-widest">
                  <th className="py-3.5 px-5 font-bold">Candidate</th>
                  <th className="py-3.5 px-5 font-bold">Listing / Company</th>
                  <th className="py-3.5 px-5 font-bold">Status Badge</th>
                  <th className="py-3.5 px-5 font-bold">Date Logged</th>
                  <th className="py-3.5 px-5 font-bold">Faculty Verify</th>
                  <th className="py-3.5 px-5 font-bold text-right">Action Handler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F0EC]">
                {visibleApps.map((app) => {
                  const isEditing = editingAppId === app.id;
                  
                  return (
                    <tr 
                      key={app.id} 
                      className="hover:bg-[#faf9f5] transition-colors text-xs"
                    >
                      {/* Student Details */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-[#113f48]/10 text-editorial font-serif flex items-center justify-center font-bold text-xs shrink-0 shadow-inner">
                            {app.studentName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{app.studentName}</p>
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">{app.studentCollege || 'Undergraduate'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Internship Details */}
                      <td className="py-4 px-5">
                        <p className="font-medium text-gray-800 leading-normal">{app.internshipTitle}</p>
                        <p className="text-[10px] text-gray-500 font-mono italic mt-0.5">{app.companyName}</p>
                      </td>

                      {/* Status Badging */}
                      <td className="py-4 px-5">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <select
                              id={`table-status-select-${app.id}`}
                              value={statusDraft}
                              onChange={(e) => {
                                setStatusDraft(e.target.value as any);
                                // Set initial dummy template if switching to Offer
                                if (e.target.value === 'Offer') {
                                  setOfferTextDraft(`Congratulations, ${app.studentName}! We offer you the intern position at ${app.companyName}. Stipend: $40/hour, starts next season.`);
                                }
                              }}
                              className="bg-cream-bg border border-[#ecece0] rounded-md px-1.5 py-1 text-xs text-editorial"
                            >
                              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                        ) : (
                          <span className={`inline-block text-[10px] font-mono px-2 py-0.5 rounded border ${getStatusStyle(app.status)}`}>
                            {app.status}
                          </span>
                        )}
                      </td>

                      {/* Date applied */}
                      <td className="py-4 px-5 font-mono text-gray-500">{app.dateApplied}</td>

                      <td className="py-4 px-5">
                        <span className={`inline-block text-[10px] font-mono px-2 py-0.5 rounded border ${
                          (app.facultyVerificationStatus || 'Pending') === 'Verified'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : (app.facultyVerificationStatus || 'Pending') === 'Unverified'
                              ? 'bg-rose-50 text-rose-700 border-rose-250'
                              : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                        }`}>
                          {app.facultyVerificationStatus || 'Pending'}
                        </span>
                      </td>

                      {/* Row management buttons */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <button
                                id={`save-status-btn-${app.id}`}
                                onClick={() => handleUpdateStatusSubmit(app.id)}
                                className="px-2.5 py-1 bg-emerald-600 text-white rounded text-[11px] font-semibold hover:bg-emerald-700 cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                id={`cancel-status-btn-${app.id}`}
                                onClick={() => setEditingAppId(null)}
                                className="p-1 bg-gray-100 text-gray-500 rounded hover:bg-gray-200 cursor-pointer"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <>
                              {(currentRole === 'Company' || currentRole === 'Admin') && (
                                <button
                                  id={`edit-status-trigger-${app.id}`}
                                  onClick={() => {
                                    setEditingAppId(app.id);
                                    setStatusDraft(app.status);
                                    setOfferTextDraft(app.offerDetails || '');
                                  }}
                                  className="p-1 px-2 hover:bg-cream-accent/50 text-gray-500 hover:text-editorial border border-transparent hover:border-[#ecece0] rounded text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                                  title="Edit status"
                                >
                                  <Edit size={11} /> <span>Set</span>
                                </button>
                              )}
                              <button
                                id={`inspect-row-btn-${app.id}`}
                                onClick={() => setSelectedApp(app)}
                                className="text-editorial font-semibold hover:underline text-[11px] flex items-center gap-0.5 cursor-pointer ml-1"
                              >
                                Open <ArrowRight size={11} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div className="p-3 border-t border-[#ecece0] bg-[#fdfdfb] text-center">
            <span className="text-[10px] text-gray-400 font-mono tracking-wider uppercase">
              RECRUITER EVALUATION AUDIT MODULE
            </span>
          </div>
        </div>
      )}

      {/* DETAILED APPLICANT AUDIT DRAWER MODAL (POPUP) */}
      {selectedApp && createPortal(
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-[#E5E2DE] relative overflow-y-auto max-h-[90vh]">
            
            <button
              id="close-tracker-drawer-btn"
              onClick={() => setSelectedApp(null)}
              className="absolute top-4 right-4 p-1 rounded-full text-[#94A3B8] hover:text-[#1A1C1E] hover:bg-[#F9F8F6] transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="border-b border-[#F1F0EC] pb-4 mb-4">
              <span className="text-[9px] font-mono text-[#94A3B8] uppercase tracking-widest font-bold">
                Application Portfolio & Vetting Dossier
              </span>
              <h3 className="font-serif font-bold text-lg text-editorial mt-0.5">
                {selectedApp.internshipTitle}
              </h3>
              <p className="text-xs text-[#64748B]">{selectedApp.companyName} Division</p>
            </div>

            <div className="space-y-5">
              {/* Profile Card Summary */}
              <div className="p-3.5 bg-[#F9F8F6] border border-[#E5E2DE] rounded-xl flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-full bg-editorial text-white font-serif font-bold text-sm flex items-center justify-center">
                  {selectedApp.studentName.charAt(0)}
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-[#1A1C1E]">{selectedApp.studentName}</h4>
                  <p className="text-[10px] text-[#64748B] font-mono">{selectedApp.studentEmail}</p>
                  <p className="text-[10px] text-editorial-light font-bold mt-0.5 italic">{selectedApp.studentCollege || 'Stanford University'}</p>
                </div>

                <div className="ml-auto text-right">
                  <span className={`inline-block text-[10px] font-mono px-2 py-0.5 rounded border ${getStatusStyle(selectedApp.status)}`}>
                    {selectedApp.status}
                  </span>
                  <p className="text-[9px] text-[#94A3B8] font-mono mt-1">Logged {selectedApp.dateApplied}</p>
                </div>
              </div>
              <div className="p-3 bg-white border border-[#E5E2DE] rounded-xl text-left">
                <p className="text-[10px] font-mono uppercase tracking-wider text-[#94A3B8] font-bold">Faculty Verification</p>
                <p className="text-xs text-[#1A1C1E] mt-1">
                  Status: <span className="font-semibold">{selectedApp.facultyVerificationStatus || 'Pending'}</span>
                </p>
                {selectedApp.facultyVerificationStatus === 'Unverified' && selectedApp.facultyUnverifiedReason && (
                  <p className="text-xs text-rose-700 mt-1.5 bg-rose-50 border border-rose-200 rounded p-2">
                    Reason: {selectedApp.facultyUnverifiedReason}
                  </p>
                )}
              </div>

              {/* Candidate Biography Elevator Pitch */}
              {selectedAppProfile?.bio && (
                <div className="space-y-1.5 text-left">
                  <h5 className="text-[10px] font-mono uppercase tracking-wider text-[#94A3B8] font-bold">Candidate Biography</h5>
                  <p className="text-xs leading-relaxed text-[#64748B] bg-[#F9F8F6] border border-[#E5E2DE] p-3.5 rounded-xl font-sans">
                    {selectedAppProfile.bio}
                  </p>
                </div>
              )}

              {/* Technical & Core Skills Tags */}
              {selectedAppProfile?.skills && selectedAppProfile.skills.length > 0 && (
                <div className="space-y-1.5 text-left">
                  <h5 className="text-[10px] font-mono uppercase tracking-wider text-[#94A3B8] font-bold">Technical & Core Skills</h5>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedAppProfile.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-2.5 py-1 bg-white text-editorial border border-[#E5E2DE] text-[10px] font-mono rounded-lg transition-all shadow-xs"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Channels */}
              {(selectedAppProfile?.githubUrl || selectedAppProfile?.linkedinUrl || selectedAppProfile?.xUrl) && (
                <div className="space-y-1.5 text-left">
                  <h5 className="text-[10px] font-mono uppercase tracking-wider text-[#94A3B8] font-bold">Social Channels</h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedAppProfile?.githubUrl && (
                      <a
                        id="candidate-github-link"
                        href={selectedAppProfile.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-zinc-50 text-editorial border border-[#E5E2DE] hover:border-zinc-300 text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-xs"
                      >
                        <Github size={12} className="text-[#1A1C1E]" />
                        <span>GitHub</span>
                        <ExternalLink size={10} className="text-[#94A3B8]" />
                      </a>
                    )}
                    {selectedAppProfile?.linkedinUrl && (
                      <a
                        id="candidate-linkedin-link"
                        href={selectedAppProfile.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-zinc-50 text-editorial border border-[#E5E2DE] hover:border-zinc-300 text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-xs"
                      >
                        <Linkedin size={12} className="text-[#0A66C2]" />
                        <span>LinkedIn</span>
                        <ExternalLink size={10} className="text-[#94A3B8]" />
                      </a>
                    )}
                    {selectedAppProfile?.xUrl && (
                      <a
                        id="candidate-x-link"
                        href={selectedAppProfile.xUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-zinc-50 text-editorial border border-[#E5E2DE] hover:border-zinc-300 text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-xs"
                      >
                        <Twitter size={12} className="text-black" />
                        <span>X / Twitter</span>
                        <ExternalLink size={10} className="text-[#94A3B8]" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Cover letter text */}
              <div className="space-y-1.5 text-left">
                <h5 className="text-[10px] font-mono uppercase tracking-wider text-[#94A3B8] font-bold">Applicant Pitch & Letter</h5>
                <p className="text-xs leading-relaxed text-[#64748B] bg-[#F9F8F6] border border-[#E5E2DE] p-3.5 rounded-xl font-sans" id="applicant-pitch-content">
                  {selectedApp.coverLetter || 'No cover pitch provided.'}
                </p>
              </div>

              {/* Resume attachment review */}
              <div className="space-y-1 text-left">
                <h5 className="text-[10px] font-mono uppercase tracking-wider text-[#94A3B8] font-bold">Vetted Resume Document</h5>
                <div className="p-2.5 bg-[#F9F8F6] border border-[#E5E2DE] rounded-lg flex items-center justify-between text-xs text-[#1A1C1E]">
                  <span className="font-medium">{selectedApp.resumeName || 'Applicant_Portfolio_CV.pdf'}</span>
                  {selectedApp.resumeUrl ? (
                    <a
                      id="simulate-download-resume"
                      href={
                        selectedApp.resumeUrl.startsWith('http://') || selectedApp.resumeUrl.startsWith('https://')
                          ? selectedApp.resumeUrl
                          : `http://localhost:5000${selectedApp.resumeUrl}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-editorial hover:underline flex items-center gap-0.5 cursor-pointer text-[11.5px] font-bold transition-all"
                    >
                      View File <ExternalLink size={11} />
                    </a>
                  ) : (
                    <span className="text-gray-400 text-xs italic">No resume attached</span>
                  )}
                </div>
              </div>

              {/* Formal Offer Letter section */}
              {selectedApp.status === 'Offer' && (
                <div className="p-4 rounded-xl bg-emerald-50/20 border border-emerald-500/20 text-left space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs">
                    <FileCheck size={16} />
                    <span>Official Offer Letter Proposals Ready</span>
                  </div>
                  <p className="text-xs text-[#64748B] leading-relaxed bg-white p-3 border border-[#E5E2DE] rounded-lg italic col-span-2">
                    "{selectedApp.offerDetails || 'Congratulations! Offer Letter initialized details.'}"
                  </p>

                  {/* Student Interactive signatures */}
                  {currentRole === 'Student' && (
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        id="student-accept-offer-btn"
                        onClick={() => handleStudentOfferAction(selectedApp, 'accept')}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow flex items-center justify-center gap-1"
                      >
                        <CheckCircle2 size={13} />
                        Sign & Accept Offer
                      </button>
                      <button
                        id="student-decline-offer-btn"
                        onClick={() => handleStudentOfferAction(selectedApp, 'decline')}
                        className="py-2 px-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Recruiter / Admin Direct Pipeline status update inside detail popup */}
              {(currentRole === 'Company' || currentRole === 'Admin') && (
                <div className="p-4 rounded-xl bg-[#F9F8F6] border border-[#E5E2DE] text-left space-y-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#94A3B8] block font-bold">
                    Direct Recruiter Pipeline Override Controls
                  </span>
                  
                  {editingAppId === selectedApp.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono uppercase text-gray-400">Target Stage</label>
                          <select
                            id="detail-edit-status-select"
                            value={statusDraft}
                            onChange={(e) => {
                              setStatusDraft(e.target.value as any);
                              if (e.target.value === 'Offer' && !offerTextDraft) {
                                setOfferTextDraft(`Congratulations, ${selectedApp.studentName}! We are thrilled to offer you the internship at ${selectedApp.companyName}.`);
                              }
                            }}
                            className="w-full bg-cream-bg border border-[#ecece0] p-1.5 rounded-lg text-xs text-editorial"
                          >
                            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>

                      {statusDraft === 'Offer' && (
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono uppercase text-gray-400">Offer details / Salary terms</label>
                          <textarea
                            id="detail-edit-offer-textarea"
                            rows={3}
                            value={offerTextDraft}
                            onChange={(e) => setOfferTextDraft(e.target.value)}
                            className="w-full text-xs font-sans p-2 rounded-lg bg-cream-bg border border-[#ecece0] resize-none"
                            placeholder="Salary stipend terms, starting dates etc..."
                          />
                        </div>
                      )}

                      <div className="flex gap-2 justify-end">
                        <button
                          id="submit-override-status-btn"
                          onClick={() => {
                            onUpdateStatus(selectedApp.id, statusDraft, statusDraft === 'Offer' ? offerTextDraft : undefined);
                            // Refresh the popup details instantly or simply close it
                            const updatedSelected = { ...selectedApp, status: statusDraft, offerDetails: statusDraft === 'Offer' ? offerTextDraft : undefined };
                            setSelectedApp(updatedSelected);
                            setEditingAppId(null);
                          }}
                          className="px-3.5 py-1.5 bg-editorial text-white hover:bg-editorial-light text-xs font-semibold rounded-lg shadow cursor-pointer"
                        >
                          Save Changes
                        </button>
                        <button
                          id="cancel-override-status-btn"
                          onClick={() => setEditingAppId(null)}
                          className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs rounded-lg cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">Need to update this applicant's interview stage or dispatch an offer letter?</p>
                      <button
                        id="initialize-override-btn"
                        onClick={() => {
                          setEditingAppId(selectedApp.id);
                          setStatusDraft(selectedApp.status);
                          setOfferTextDraft(selectedApp.offerDetails || '');
                        }}
                        className="py-1 px-3 bg-editorial text-white hover:bg-editorial-light text-xs font-semibold rounded-lg shadow-sm cursor-pointer shrink-0 ml-4"
                      >
                        Override Status
                      </button>
                    </div>
                  )}
                </div>
              )}

              {currentRole === 'Faculty' && (
                <div className="p-4 rounded-xl bg-[#F9F8F6] border border-[#E5E2DE] text-left space-y-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#94A3B8] block font-bold">
                    Faculty Controls
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onFacultyVerifyApplication(selectedApp.id, 'Verified')}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 cursor-pointer"
                    >
                      Mark Verified
                    </button>
                    <button
                      onClick={() => {
                        if (!facultyReasonDraft.trim()) {
                          triggerToast('Reason Required', 'Please add reason for unverified application.', 'error');
                          return;
                        }
                        onFacultyVerifyApplication(selectedApp.id, 'Unverified', facultyReasonDraft);
                      }}
                      className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 cursor-pointer"
                    >
                      Mark Unverified
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={facultyReasonDraft}
                    onChange={(e) => setFacultyReasonDraft(e.target.value)}
                    placeholder="Reason required when marking unverified"
                    className="w-full text-xs font-sans p-2 rounded-lg bg-white border border-[#ecece0] resize-none"
                  />
                  {allUsers
                    .filter(u => u.role === 'Company' && u.companyName?.toLowerCase() === selectedApp.companyName.toLowerCase())
                    .map((recruiter) => (
                      <div key={recruiter.id} className="p-2.5 bg-white border border-[#E5E2DE] rounded-lg space-y-2">
                        <p className="text-xs font-semibold text-[#1A1C1E]">
                          Recruiter: {recruiter.name} ({recruiter.companyName})
                        </p>
                        <p className="text-[11px] text-[#64748B]">
                          Status: {recruiter.recruiterVerificationStatus || 'Pending'}
                        </p>
                        {recruiter.recruiterVerificationStatus === 'Not Genuine' && recruiter.recruiterVerificationReason && (
                          <p className="text-[11px] text-rose-700">
                            Reason: {recruiter.recruiterVerificationReason}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => onFacultyVerifyRecruiter(recruiter.id, 'Genuine')}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded text-[11px] font-semibold hover:bg-emerald-700"
                          >
                            Mark Genuine
                          </button>
                          <button
                            onClick={() => {
                              if (!recruiterReasonDraft.trim()) {
                                triggerToast('Reason Required', 'Add reason for not genuine recruiter.', 'error');
                                return;
                              }
                              onFacultyVerifyRecruiter(recruiter.id, 'Not Genuine', recruiterReasonDraft);
                            }}
                            className="px-2.5 py-1 bg-rose-600 text-white rounded text-[11px] font-semibold hover:bg-rose-700"
                          >
                            Mark Not Genuine
                          </button>
                        </div>
                      </div>
                    ))}
                  <textarea
                    rows={2}
                    value={recruiterReasonDraft}
                    onChange={(e) => setRecruiterReasonDraft(e.target.value)}
                    placeholder="Reason when marking recruiter not genuine"
                    className="w-full text-xs font-sans p-2 rounded-lg bg-white border border-[#ecece0] resize-none"
                  />
                </div>
              )}

            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
}

