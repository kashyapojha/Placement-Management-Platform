import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldAlert, 
  Trash2, 
  PieChart, 
  TrendingUp, 
  Check, 
  X, 
  Sparkles,
  Download,
  Info,
  Layers,
  ChevronDown,
  Building,
  GraduationCap
} from 'lucide-react';
import { UserRole, UserProfile, Internship, Application } from '../types';

interface AdminViewProps {
  currentUser: UserProfile;
  allUsers: UserProfile[];
  internships: Internship[];
  applications: Application[];
  onInviteUser: (user: UserProfile) => void;
  onRemoveUser: (userId: string) => void;
  onUpdateUserRole: (userId: string, newRole: UserRole, companyName?: string) => void;
  triggerToast: (title: string, text: string, type: 'success' | 'info' | 'error') => void;
}

export default function AdminView({
  currentUser,
  allUsers,
  internships,
  applications,
  onInviteUser,
  onRemoveUser,
  onUpdateUserRole,
  triggerToast
}: AdminViewProps) {

  // Invite modal state
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('Student');
  const [inviteCompany, setInviteCompany] = useState('');

  // Editing User role mapping
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [roleDraft, setRoleDraft] = useState<UserRole>('Student');
  const [companyDraft, setCompanyDraft] = useState('');

  // Settle statistical reports
  const totalStudents = allUsers.filter(u => u.role === 'Student').length;
  const totalCompanyRecruiters = allUsers.filter(u => u.role === 'Company').length;
  const placementRate = applications.length > 0
    ? Math.round((applications.filter(a => a.status === 'Offer').length / applications.length) * 100)
    : 0;

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) {
      triggerToast('Validation error', 'Please fill name and credentials email.', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      triggerToast('Invalid Email', 'Please insert a valid formatting email.', 'error');
      return;
    }

    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      name: inviteName,
      email: inviteEmail,
      role: inviteRole,
      companyName: inviteRole === 'Company' ? inviteCompany || 'Linear' : undefined,
      college: inviteRole === 'Student' ? 'National University' : undefined,
      skills: inviteRole === 'Student' ? ['React', 'Git'] : undefined,
      bio: `Enrolled as ${inviteRole} on university records.`
    };

    onInviteUser(newUser);
    triggerToast(
      'Invitation Sent',
      `Registered ${inviteName} as active ${inviteRole} inside user roster.`,
      'success'
    );

    // Reset Form
    setIsInviteOpen(false);
    setInviteName('');
    setInviteEmail('');
    setInviteRole('Student');
    setInviteCompany('');
  };

  const handleRoleSave = (userId: string) => {
    onUpdateUserRole(userId, roleDraft, roleDraft === 'Company' ? companyDraft : undefined);
    setEditingUserId(null);
    triggerToast('Access Authorized', 'User privileges updated successfully', 'success');
  };

  const handleReportGeneration = () => {
    triggerToast('Report Generated', 'Summer 2026 conversion audits exported cleanly to CSV.', 'success');
  };

  return (
    <div className="space-y-6 fade-in-up">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#F1F0EC] pb-5">
        <div>
          <div className="flex items-center gap-1.5 text-[#94A3B8] font-mono text-[11px] uppercase tracking-widest mb-1.5">
            <Sparkles size={11} className="text-editorial-light" />
            <span>Academic Overseer Suite</span>
          </div>
          <h1 className="text-2xl font-serif font-semibold text-editorial tracking-tight">
            Administrative Control Panel
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed font-sans">
            Monitor verified university enrollments, audit placement ratios, and regulate access privileges.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            id="admin-export-report-btn"
            onClick={handleReportGeneration}
            className="px-4 py-2 bg-[#F1F0EC] hover:bg-[#E5E2DE] border border-[#E5E2DE] text-gray-700 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <Download size={14} className="text-[#64748B]" />
            <span>Generate Report</span>
          </button>
          
          <button
            id="admin-invite-trigger-btn"
            onClick={() => setIsInviteOpen(true)}
            className="px-4 py-2 bg-editorial hover:bg-editorial-light text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all hover:scale-101"
          >
            <UserPlus size={14} />
            <span>Invite User</span>
          </button>
        </div>
      </div>

      {/* Modern High-fidelity Bento Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="admin-analytics-grid">
        <div className="bg-[#F9F8F6] border border-[#E5E2DE] rounded-2xl p-5 text-left flex items-start gap-4">
          <div className="p-3 bg-white border border-[#E5E2DE] rounded-xl text-editorial shadow-xs">
            <Users size={18} />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#94A3B8] font-bold">Total Registered users</span>
            <p className="text-2xl font-serif font-bold text-editorial leading-none mt-1.5">{allUsers.length}</p>
            <p className="text-[10px] text-[#64748B] mt-1 font-mono">Students + recruiters</p>
          </div>
        </div>

        <div className="bg-[#F9F8F6] border border-[#E5E2DE] rounded-2xl p-5 text-left flex items-start gap-4">
          <div className="p-3 bg-white border border-[#E5E2DE] rounded-xl text-indigo-700 shadow-xs">
            <Building size={18} />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#94A3B8] font-bold">Sponsor companies</span>
            <p className="text-2xl font-serif font-bold text-editorial leading-none mt-1.5">{totalCompanyRecruiters}</p>
            <p className="text-[10px] text-[#64748B] mt-1 font-mono">Active recruiting tags</p>
          </div>
        </div>

        <div className="bg-[#F9F8F6] border border-[#E5E2DE] rounded-2xl p-5 text-left flex items-start gap-4">
          <div className="p-3 bg-white border border-[#E5E2DE] rounded-xl text-[#0E5450] shadow-xs">
            <TrendingUp size={18} />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#94A3B8] font-bold">Student placement rate</span>
            <p className="text-2xl font-serif font-bold text-editorial leading-none mt-1.5">{placementRate}%</p>
            <p className="text-[10px] text-[#64748B] mt-1 font-mono">Average summer conversion</p>
          </div>
        </div>

        <div className="bg-[#F9F8F6] border border-[#E5E2DE] rounded-2xl p-5 text-left flex items-start gap-4">
          <div className="p-3 bg-white border border-[#E5E2DE] rounded-xl text-amber-700 shadow-xs">
            <Layers size={18} />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#94A3B8] font-bold">Rountable Listings</span>
            <p className="text-2xl font-serif font-bold text-editorial leading-none mt-1.5">{internships.length}</p>
            <p className="text-[10px] text-[#64748B] mt-1 font-mono">Live career openings</p>
          </div>
        </div>
      </div>

      {/* User Management Table */}
      <div className="bg-white border border-[#E5E2DE] rounded-2xl overflow-hidden" id="admin-table-container">
        <div className="px-5 py-4 border-b border-[#E5E2DE] flex items-center justify-between">
          <h4 className="font-serif font-semibold text-base text-editorial">Regulated Users Directory</h4>
          <span className="text-[10px] font-mono text-[#94A3B8] bg-[#F9F8F6] py-0.5 px-2 rounded border border-[#E5E2DE]">
            System Users: {allUsers.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9F8F6] border-b border-[#E5E2DE] text-[10px] font-mono text-[#94A3B8] uppercase tracking-widest font-bold">
                <th className="py-3 px-5">User Coordinates</th>
                <th className="py-3 px-5">Security Level</th>
                <th className="py-3 px-5">Affiliated Institution</th>
                <th className="py-3 px-5 text-right">Directory Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E2DE]/80">
              {allUsers.map((user) => {
                const isEditing = editingUserId === user.id;

                let roleBadgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                if (user.role === 'Admin') roleBadgeColor = 'bg-rose-50 text-rose-800 border-rose-200';
                if (user.role === 'Company') roleBadgeColor = 'bg-indigo-50 text-indigo-800 border-indigo-200';
                if (user.role === 'Faculty') roleBadgeColor = 'bg-teal-50 text-teal-800 border-teal-200';

                return (
                  <tr key={user.id} className="hover:bg-[#F9F8F6]/60 transition-colors text-xs" id={`user-row-${user.id}`}>
                    {/* User identifier */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3 font-sans">
                        <div className="h-8 w-8 rounded-full bg-[#F1F0EC] text-editorial font-serif flex items-center justify-center font-bold shrink-0 border border-[#E5E2DE]">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-[#1A1C1E]">{user.name}</p>
                          <p className="text-[10px] text-[#94A3B8] font-mono -mt-0.5">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role update field */}
                    <td className="py-4 px-5">
                      {isEditing ? (
                        <select
                          id={`user-role-select-${user.id}`}
                          value={roleDraft}
                          onChange={(e) => {
                            setRoleDraft(e.target.value as any);
                            if (e.target.value === 'Company' && !companyDraft) {
                              setCompanyDraft('Linear');
                            }
                          }}
                          className="bg-white border border-[#E5E2DE] focus:border-editorial-light p-1.5 rounded-lg text-xs font-bold text-editorial outline-hidden"
                        >
                          <option value="Student">Student</option>
                          <option value="Company">Company / Recruiter</option>
                          <option value="Faculty">Faculty</option>
                          <option value="Admin">Admin</option>
                        </select>
                      ) : (
                        <span className={`inline-block text-[10px] font-mono px-2 py-0.5 rounded border ${roleBadgeColor}`}>
                          {user.role}
                        </span>
                      )}
                    </td>

                    {/* Associated corporate key */}
                    <td className="py-4 px-5">
                      {isEditing && roleDraft === 'Company' ? (
                        <input
                          id={`user-company-input-${user.id}`}
                          type="text"
                          value={companyDraft}
                          onChange={(e) => setCompanyDraft(e.target.value)}
                          className="bg-white border border-[#E5E2DE] focus:border-editorial-light p-1.5 rounded-lg text-xs text-editorial max-w-[120px] outline-hidden"
                          placeholder="Company name"
                        />
                      ) : (
                        <span className="text-[#64748B] font-semibold font-sans">
                          {user.role === 'Company' ? user.companyName : (user.college || 'Incipio Academic')}
                        </span>
                      )}
                    </td>

                    {/* Controls delete or save */}
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isEditing ? (
                          <>
                            <button
                              id={`save-user-role-${user.id}`}
                              onClick={() => handleRoleSave(user.id)}
                              className="px-2.5 py-1 bg-emerald-600 text-white rounded text-[11px] font-semibold hover:bg-emerald-700 cursor-pointer shadow-sm"
                            >
                              Save
                            </button>
                            <button
                              id={`cancel-user-role-${user.id}`}
                              onClick={() => setEditingUserId(null)}
                              className="p-1 bg-gray-100 rounded hover:bg-gray-200 cursor-pointer"
                            >
                              <X size={12} className="text-gray-500" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              id={`edit-user-role-trigger-${user.id}`}
                              onClick={() => {
                                setEditingUserId(user.id);
                                setRoleDraft(user.role);
                                setCompanyDraft(user.companyName || '');
                              }}
                              className="text-editorial font-semibold hover:underline text-[11px] cursor-pointer"
                            >
                              Assign Access
                            </button>
                            
                            {user.id !== currentUser.id && (
                              <button
                                id={`delete-user-btn-${user.id}`}
                                onClick={() => {
                                  onRemoveUser(user.id);
                                  triggerToast('User Removed', `Revoked credentials for ${user.name} safely.`, 'info');
                                }}
                                className="p-1 text-gray-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer transition-colors"
                                title="Remove User"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
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

        <div className="p-4 border-t border-[#E5E2DE] bg-[#F1F0EC]/25">
          <div className="flex items-center gap-2 text-[11px] text-[#64748B] justify-center font-sans">
            <ShieldAlert size={14} className="text-editorial-light font-bold" />
            <p>Admin edits will update acting privileges instantly. Test role simulator in top-right whenever desired.</p>
          </div>
        </div>
      </div>

      {/* INVITE NEW USER (MODAL) */}
      {isInviteOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-lg border border-[#E5E2DE] relative">
            
            <button
              id="cancel-invite-modal"
              onClick={() => setIsInviteOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-[#94A3B8] hover:text-editorial hover:bg-[#F9F8F6] transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              
              <div className="border-b border-[#E5E2DE] pb-3 mb-4">
                <span className="text-[10px] font-mono text-[#94A3B8] uppercase tracking-wider block font-bold">Credential Registry</span>
                <h3 className="font-serif font-bold text-lg text-editorial">
                  Invite New Workspace User
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">Invited users appear instantly and will be mockable via top switcher.</p>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] uppercase font-mono tracking-wider text-[#94A3B8] font-bold">Full Legal Name *</label>
                <input
                  id="invite-name-input"
                  type="text"
                  required
                  placeholder="e.g. Jane Foster"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full bg-white border border-[#E5E2DE] focus:border-editorial-light px-3.5 py-2 rounded-lg text-xs outline-hidden"
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] uppercase font-mono tracking-wider text-[#94A3B8] font-bold">Email Address *</label>
                <input
                  id="invite-email-input"
                  type="email"
                  required
                  placeholder="jane.foster@university.edu"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-white border border-[#E5E2DE] focus:border-editorial-light px-3.5 py-2 rounded-lg text-xs outline-hidden"
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] uppercase font-mono tracking-wider text-[#94A3B8] font-bold">Access Security Class *</label>
                <select
                  id="invite-role-select"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full bg-white border border-[#E5E2DE] focus:border-editorial-light p-2.5 rounded-lg text-xs text-editorial outline-hidden font-bold"
                >
                  <option value="Student">Student (Undergraduate Candidate)</option>
                  <option value="Company">Company / Corporate Recruiter</option>
                  <option value="Faculty">Faculty Reviewer</option>
                  <option value="Admin">Academic System Admin</option>
                </select>
              </div>

              {inviteRole === 'Company' && (
                <div className="space-y-1 text-left">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-[#94A3B8] font-bold">Associated Sponsor Institution</label>
                  <input
                    id="invite-company-input"
                    type="text"
                    required
                    placeholder="e.g. Stripe, Linear"
                    value={inviteCompany}
                    onChange={(e) => setInviteCompany(e.target.value)}
                    className="w-full bg-white border border-[#E5E2DE] focus:border-editorial-light px-3.5 py-2.5 rounded-lg text-xs outline-hidden"
                  />
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4 border-t border-[#E5E2DE] mt-4 font-sans">
                <button
                  type="button"
                  id="invite-modal-cancel"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-4 py-2 bg-[#F1F0EC] hover:bg-[#E5E2DE] text-gray-700 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="invite-modal-submit"
                  className="px-5 py-2 bg-editorial hover:bg-editorial-light text-white rounded-lg text-xs font-bold cursor-pointer shadow-sm flex items-center gap-1 transition-all"
                >
                  Confirm Registration <Check size={14} />
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}

