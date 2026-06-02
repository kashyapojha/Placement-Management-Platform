import React from 'react';
import { 
  Building2, 
  Users, 
  Send, 
  TrendingUp, 
  Calendar, 
  ArrowRight,
  Sparkles,
  ClipboardCheck,
  Zap,
  MessageSquare,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { UserRole, UserProfile, Internship, Application, ActivityLog } from '../types';

interface DashboardViewProps {
  currentRole: UserRole;
  currentUser: UserProfile;
  internships: Internship[];
  applications: Application[];
  activityLogs: ActivityLog[];
  setCurrentTab: (tab: string) => void;
  setListingsFilter: (filter: string) => void;
  triggerToast: (title: string, text: string, type: 'success' | 'info' | 'error') => void;
}

export default function DashboardView({
  currentRole,
  currentUser,
  internships,
  applications,
  activityLogs,
  setCurrentTab,
  setListingsFilter,
  triggerToast
}: DashboardViewProps) {

  // Logic to calculate role-specific metrics
  const getMetrics = () => {
    switch (currentRole) {
      case 'Student': {
        const studentApps = applications.filter(a => a.studentId === currentUser.id);
        const interviews = studentApps.filter(a => a.status === 'Interview').length;
        const offers = studentApps.filter(a => a.status === 'Offer').length;
        const totalSent = studentApps.length;
        
        return [
          { 
            id: 'apps-sent',
            title: 'Applications Submitted', 
            val: totalSent, 
            unit: 'active files', 
            color: 'border-editorial-light',
            bg: 'bg-editorial-light/5',
            desc: 'Consistently reviewing',
            actionText: 'View status board',
            action: () => setCurrentTab('tracker')
          },
          { 
            id: 'interviews-cnt',
            title: 'Interviews Scheduled', 
            val: interviews, 
            unit: 'conversations', 
            color: 'border-amber-500',
            bg: 'bg-amber-50/25',
            desc: 'Preparation recommended',
            actionText: 'Check messages',
            action: () => setCurrentTab('messages')
          },
          { 
            id: 'offers-cnt',
            title: 'Offer Letters Received', 
            val: offers, 
            unit: 'offers issued', 
            color: 'border-editorial',
            bg: 'bg-editorial/5',
            desc: 'Outstanding proposals',
            actionText: 'Sign offers',
            action: () => setCurrentTab('tracker')
          }
        ];
      }
      case 'Company': {
        const recruiterCompany = currentUser.companyName || 'Linear';
        const companyListings = internships.filter(i => i.company && i.company.toLowerCase() === recruiterCompany.toLowerCase());
        const companyListingsCount = companyListings.length;
        
        const companyApps = applications.filter(a => a.companyName && a.companyName.toLowerCase() === recruiterCompany.toLowerCase());
        const activeApplicants = companyApps.length;
        const pendingOffers = companyApps.filter(a => a.status === 'Offer').length;

        return [
          { 
            id: 'listings-cnt',
            title: 'Our Managed listings', 
            val: companyListingsCount, 
            unit: 'live openings', 
            color: 'border-editorial',
            bg: 'bg-page-bg',
            desc: 'Active marketing channels',
            actionText: 'Post new internship',
            action: () => {
              setListingsFilter('all');
              setCurrentTab('listings');
              triggerToast('System Info', 'Click "Post New Internship" at the top-right of the Internships page.', 'info');
            }
          },
          { 
            id: 'applicants-cnt',
            title: 'Assigned Applicants', 
            val: activeApplicants, 
            unit: 'students', 
            color: 'border-editorial',
            bg: 'bg-editorial/5',
            desc: 'Applications to complete',
            actionText: 'Manage pipeline',
            action: () => setCurrentTab('tracker')
          },
          { 
            id: 'pending-offers',
            title: 'Outstanding Offers', 
            val: pendingOffers, 
            unit: 'proposals', 
            color: 'border-editorial-light',
            bg: 'bg-editorial-light/5',
            desc: 'Awaiting student replies',
            actionText: 'Review tracker',
            action: () => setCurrentTab('tracker')
          }
        ];
      }
      case 'Admin': {
        const totalL = internships.length;
        const totalApps = applications.length;
        const placementCount = applications.filter(a => a.status === 'Offer').length;
        const placementPercentage = totalApps > 0 ? Math.round((placementCount / totalApps) * 100) : 0;

        return [
          { 
            id: 'admin-listings',
            title: 'Global Career Listings', 
            val: totalL, 
            unit: 'active roles', 
            color: 'border-editorial',
            bg: 'bg-stone-50/40',
            desc: 'Across all registered industry partners',
            actionText: 'Manage internships',
            action: () => setCurrentTab('listings')
          },
          { 
            id: 'admin-applicants',
            title: 'Global Pipeline Candidates', 
            val: totalApps, 
            unit: 'submissions', 
            color: 'border-amber-500',
            bg: 'bg-amber-50/20',
            desc: 'Tracking across all sectors',
            actionText: 'View global tracker',
            action: () => setCurrentTab('tracker')
          },
          { 
            id: 'admin-conversion',
            title: 'Hired / Placement Rate', 
            val: `${placementPercentage}%`, 
            unit: 'success target', 
            color: 'border-editorial-light',
            bg: 'bg-editorial-light/5',
            desc: 'Completed offer cycles',
            actionText: 'Inspect global metrics',
            action: () => setCurrentTab('admin')
          }
        ];
      }
      case 'Faculty': {
        const pendingVerification = applications.filter(a => (a.facultyVerificationStatus || 'Pending') === 'Pending').length;
        const unverifiedCount = applications.filter(a => a.facultyVerificationStatus === 'Unverified').length;
        const flaggedRecruiters = currentUser.role === 'Faculty'
          ? 0
          : 0;

        return [
          { 
            id: 'faculty-pending',
            title: 'Pending Application Checks', 
            val: pendingVerification, 
            unit: 'awaiting review', 
            color: 'border-editorial',
            bg: 'bg-page-bg',
            desc: 'Needs faculty verification',
            actionText: 'Open tracker',
            action: () => setCurrentTab('tracker')
          },
          { 
            id: 'faculty-unverified',
            title: 'Unverified Applications', 
            val: unverifiedCount, 
            unit: 'flagged', 
            color: 'border-amber-500',
            bg: 'bg-amber-50/20',
            desc: 'Reason shared with students',
            actionText: 'Review reasons',
            action: () => setCurrentTab('tracker')
          },
          { 
            id: 'faculty-recruiters',
            title: 'Recruiter Authenticity Checks', 
            val: flaggedRecruiters, 
            unit: 'managed via tracker', 
            color: 'border-editorial-light',
            bg: 'bg-editorial-light/5',
            desc: 'Mark genuine / not genuine',
            actionText: 'Verify recruiters',
            action: () => setCurrentTab('tracker')
          }
        ];
      }
    }
  };

  const metrics = getMetrics();

  // Pick internships approaching soon
  const premiumDeadlines = internships.slice(0, 3);

  return (
    <div className="space-y-8 fade-in-up">
      
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-[#F1F0EC] pb-6">
        <div>
          <div className="flex items-center gap-1.5 text-[#64748B] font-mono text-[11px] uppercase tracking-widest mb-1.5">
            <Sparkles size={12} className="text-editorial-light" />
            <span>Consolidated Overview</span>
          </div>
          <h1 className="text-3xl md:text-3xl font-serif text-editorial tracking-tight font-semibold">
            The workspace for talent creation.
          </h1>
          <p className="text-sm font-sans text-[#64748B] max-w-xl mt-1.5 leading-relaxed">
            Monitor real-time progress, assess pending letters of recommendation, and communicate directly across roles.
          </p>
        </div>
        
        {/* Nice calendar-driven indicator */}
        <div className="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-[#E5E2DE] self-start md:self-auto shadow-sm">
          <Calendar size={18} className="text-editorial-light" />
          <div className="text-left select-none">
            <p className="text-[10px] font-mono uppercase tracking-wider text-[#94A3B8]">Current Academic Date</p>
            <p className="text-xs font-semibold text-[#1A1C1E]">June 2, 2026</p>
          </div>
        </div>
      </div>

      {/* Asymmetric Elegant Key Metric Cards */}
      <div id="metric-cards-grid" className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {metrics.map((card, index) => (
          <div
            key={card.id}
            id={`dashboard-metric-${card.id}`}
            className={`border-l-4 ${card.color} ${card.bg} bg-white p-6 rounded-r-xl border-y border-r border-[#E5E2DE] shadow-sm hover:shadow-md transition-all flex flex-col justify-between`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-[#64748B] tracking-wider uppercase">
                  {card.title}
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-editorial-light" />
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl font-serif font-semibold text-editorial leading-none">
                  {card.val}
                </span>
                <span className="text-xs text-[#94A3B8] font-sans italic">{card.unit}</span>
              </div>
              <p className="text-xs text-[#64748B] font-mono mt-1 pr-4">{card.desc}</p>
            </div>

            <button
              id={`metric-btn-${card.id}`}
              onClick={card.action}
              className="mt-6 text-xs text-editorial-light font-semibold hover:text-brand-700 flex items-center gap-1.5 hover:underline cursor-pointer transition-all self-start"
            >
              <span>{card.actionText}</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Layout Grid: Left Deadlines & Lists, Right Activity Feed - Asymmetric */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
        
        {/* Left Column (8 cols): Deadlines or Featured placements */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-[#E5E2DE] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[#F1F0EC] mb-5">
              <div>
                <h3 className="font-serif font-semibold text-lg text-editorial">
                  Urgent Internship Deadlines
                </h3>
                <p className="text-xs text-[#64748B] font-sans mt-0.5">Apply before the application portals close</p>
              </div>
              <button 
                id="view-all-listings-from-deadlines-btn"
                onClick={() => { setListingsFilter('all'); setCurrentTab('listings'); }} 
                className="text-xs text-editorial-light font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Browse all</span>
                <ArrowRight size={13} />
              </button>
            </div>

            <div className="space-y-4">
              {premiumDeadlines.map((i) => (
                <div 
                  key={i.id} 
                  className="flex items-center justify-between p-3.5 rounded-xl bg-[#F9F8F6]/40 border border-[#E5E2DE]/60 hover:border-editorial-light/45 hover:bg-[#F9F8F6]/90 transition-all group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`h-10 w-10 shrink-0 rounded-lg flex items-center justify-center font-serif text-sm font-bold ${i.logoBg} shadow-inner`}>
                      {i.company.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-[#1A1C1E] group-hover:text-editorial-light transition-colors truncate">
                        {i.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-[#64748B] mt-0.5">
                        <span className="font-medium text-[#1A1C1E]">{i.company}</span>
                        <span>GÇó</span>
                        <span>{i.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="inline-block text-[10px] font-mono bg-amber-50 text-amber-850 border border-amber-200 rounded px-2 py-0.5 font-semibold">
                      {i.deadline}
                    </span>
                    <p className="text-[10px] text-[#94A3B8] mt-1 font-mono">{i.stipend}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 p-4 rounded-xl bg-editorial-light/5 border border-editorial-light/10 flex items-center gap-3">
              <Zap size={16} className="text-editorial-light shrink-0" />
              <p className="text-xs text-editorial leading-normal">
                <strong>Pro-tip for Summer applicants:</strong> Complete your Profile resume uploads and skill validation metrics in the <span className="font-semibold underline cursor-pointer hover:text-editorial-light" onClick={() => setCurrentTab('profile')}>My Documents</span> tab to stand out instantly to top recruiters.
              </p>
            </div>
          </div>

          {/* Quick Informational / Action panel */}
          <div className="bg-white border border-[#E5E2DE] rounded-2xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#F9F8F6] border border-[#E5E2DE]">
              <div className="flex items-center gap-2 text-editorial-light mb-2">
                <MessageSquare size={16} />
                <span className="text-xs font-semibold">Instant Communication</span>
              </div>
              <p className="text-xs text-[#64748B] mb-3 leading-relaxed">
                Connect directly with corporate partners and ask about day-to-day stack demands.
              </p>
              <button
                id="dashboard-goto-messages-btn"
                onClick={() => setCurrentTab('messages')}
                className="text-xs font-semibold text-editorial-light hover:underline flex items-center gap-1 cursor-pointer"
              >
                Open Inbox <ArrowRight size={12} />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#F9F8F6] border border-[#E5E2DE]">
              <div className="flex items-center gap-2 text-editorial-light mb-2">
                <ClipboardCheck size={16} />
                <span className="text-xs font-semibold">Academic Compliance</span>
              </div>
              <p className="text-xs text-[#64748B] mb-3 leading-relaxed">
                Platform audits, student verifications, and system invitations are controlled by Admins.
              </p>
              <button
                id="dashboard-goto-admin-btn"
                onClick={() => setCurrentTab('admin')}
                className="text-xs font-semibold text-editorial-light hover:underline flex items-center gap-1 cursor-pointer"
              >
                Go to Controls <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Live Activity Feed */}
        <div className="lg:col-span-5">
          <div className="bg-white border border-[#E5E2DE] rounded-2xl p-6 shadow-sm h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#F1F0EC] mb-5">
                <div>
                  <h3 className="font-serif font-semibold text-lg text-editorial">
                    System Activity Log
                  </h3>
                  <p className="text-xs text-[#64748B] font-sans mt-0.5">Real-time status mutations</p>
                </div>
                <Clock size={16} className="text-[#94A3B8]" />
              </div>              <div className="space-y-4" id="activity-logs-container">
                {activityLogs.slice(0, 6).map((log) => {
                  let badgeColor = 'bg-[#F9F8F6] text-[#64748B] border border-[#E5E2DE]';
                  if (log.category === 'status_change') badgeColor = 'bg-amber-50 text-amber-700 border border-amber-200';
                  if (log.category === 'new_listing') badgeColor = 'bg-teal-50 text-teal-850 border border-teal-200';
                  if (log.category === 'new_application') badgeColor = 'bg-emerald-50 text-emerald-800 border border-emerald-200';
                  if (log.category === 'message') badgeColor = 'bg-blue-50 text-blue-700 border border-blue-200';

                  return (
                    <div key={log.id} className="flex gap-3 text-xs leading-relaxed">
                      <div className="flex flex-col items-center">
                        <div className="h-2 w-2 rounded-full bg-editorial-light mt-1.5 shrink-0" />
                        <div className="w-0.5 flex-1 bg-[#F1F0EC] my-1" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[#1A1C1E] font-sans font-medium">{log.text}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-[#94A3B8] font-mono">{log.time}</span>
                          <span className="text-[#94A3B8]">GÇó</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${badgeColor}`}>
                            {log.category.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-6 border-t border-[#F1F0EC] mt-6 bg-[#F9F8F6] -mx-6 -mb-6 p-6 rounded-b-2xl">
              <p className="text-[10px] text-[#94A3B8] font-mono text-center tracking-wider font-semibold">
                INCIPIO SECURE LOGS GÇö REFRESHES ON EVENTS
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

