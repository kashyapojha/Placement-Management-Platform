import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, Outlet } from 'react-router-dom';

// Custom Sub-components
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import DashboardView from './components/DashboardView';
import ListingsView from './components/ListingsView';
import TrackerView from './components/TrackerView';
import ProfileView from './components/ProfileView';
import MessagesView from './components/MessagesView';
import AdminView from './components/AdminView';
import ToastList from './components/Toast';
import RoleGuard from './components/RoleGuard';
import CareerAdvisorChatbot from './components/CareerAdvisorChatbot';

// API Services Layer
import {
  authService,
  internshipService,
  applicationService,
  messageService,
  userService,
  activityService
} from './services/api';

// Guest & Authentication Views
import LandingView from './components/LandingView';
import AuthView from './components/AuthView';

import { UserRole, UserProfile, Internship, Application, Message, ActivityLog, ToastMessage } from './types';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Session & Authentication State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('Student');
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  // Navigation State
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [listingsFilter, setListingsFilter] = useState<string>('all');

  // Collections State
  const [internships, setInternships] = useState<Internship[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  // Live Toast Notifications Array
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const nonGenuineCompanySet = new Set(
    allUsers
      .filter((u) => u.role === 'Company' && u.recruiterVerificationStatus === 'Not Genuine' && u.companyName)
      .map((u) => (u.companyName || '').toLowerCase())
  );
  const nonGenuineRecruiterIdSet = new Set(
    allUsers
      .filter((u) => u.role === 'Company' && u.recruiterVerificationStatus === 'Not Genuine')
      .map((u) => u.id)
  );
  const studentVisibleInternships = internships.filter(
    (listing) => {
      const companyRecruiters = allUsers.filter(
        (u) => u.role === 'Company' && (u.companyName || '').toLowerCase() === listing.company.toLowerCase()
      );
      const hasGenuineRecruiter = companyRecruiters.length === 0 || companyRecruiters.some((u) => u.recruiterVerificationStatus !== 'Not Genuine');
      return (
        !nonGenuineCompanySet.has(listing.company.toLowerCase()) &&
        (listing.facultyApprovalStatus || 'Pending') === 'Verified' &&
        hasGenuineRecruiter
      );
    }
  );
  const studentVisibleUsers = allUsers.filter(
    (u) => u.role !== 'Company' || u.recruiterVerificationStatus !== 'Not Genuine'
  );
  const studentVisibleMessages = messages.filter(
    (m) => !nonGenuineRecruiterIdSet.has(m.senderId) && !nonGenuineRecruiterIdSet.has(m.receiverId)
  );

  // Perform session check and fetch internships (which are public) on mount
  useEffect(() => {
    const checkSessionAndFetchPublicData = async () => {
      try {
        // Anyone can fetch public internships
        const listings = await internshipService.getAll();
        setInternships(listings);

        const token = localStorage.getItem('token');
        if (token) {
          try {
            // Validate JWT session
            const userObj = await authService.getMe();
            setCurrentUser(userObj);
            setCurrentRole(userObj.role);
            
            // Load remaining private data collections
            await fetchPrivateData();
          } catch {
            // Token is invalid/expired
            localStorage.removeItem('token');
            setCurrentUser(null);
          }
        }
      } catch (err) {
        console.error('Session validation offline:', err);
        triggerToast('Database Connection Offline', 'Please verify your backend Mongoose server is running.', 'error');
      } finally {
        setLoading(false);
      }
    };

    checkSessionAndFetchPublicData();
  }, []);

  // Poll private data periodically when logged in to achieve real-time synchronization
  useEffect(() => {
    if (!currentUser) return;
    
    // Poll every 3 seconds
    const interval = setInterval(() => {
      fetchPrivateData();
    }, 3000);
    
    return () => clearInterval(interval);
  }, [currentUser]);

  // Fetch private collections for authorized sessions
  const fetchPrivateData = async () => {
    try {
      const [users, applications, messages, logs] = await Promise.all([
        userService.getAll(),
        applicationService.getAll(),
        messageService.getAll(),
        activityService.getAll()
      ]);

      setAllUsers((prev) => {
        if (JSON.stringify(prev) !== JSON.stringify(users)) {
          return users;
        }
        return prev;
      });

      if (currentUser) {
        const refreshedCurrentUser = users.find((u: UserProfile) => u.id === currentUser.id);
        if (refreshedCurrentUser) {
          setCurrentUser((prev) => {
            if (!prev || JSON.stringify(prev) !== JSON.stringify(refreshedCurrentUser)) {
              return refreshedCurrentUser;
            }
            return prev;
          });
          setCurrentRole((prev) => {
            if (prev !== refreshedCurrentUser.role) {
              return refreshedCurrentUser.role;
            }
            return prev;
          });
        }
      }

      setApplications((prev) => {
        if (JSON.stringify(prev) !== JSON.stringify(applications)) {
          return applications;
        }
        return prev;
      });

      setMessages((prev) => {
        if (JSON.stringify(prev) !== JSON.stringify(messages)) {
          return messages;
        }
        return prev;
      });

      setActivityLogs((prev) => {
        if (JSON.stringify(prev) !== JSON.stringify(logs)) {
          return logs;
        }
        return prev;
      });
    } catch (err) {
      console.error('Error fetching authenticated datasets:', err);
    }
  };

  // Re-calculate unread inbox messages of currentUser
  useEffect(() => {
    if (!currentUser) return;
    const unreadInbox = messages.filter(m => m.receiverId === currentUser.id && !m.read).length;
    setUnreadMessagesCount(unreadInbox);
  }, [messages, currentUser]);

  // Dispatch live Toast helper
  const triggerToast = (title: string, text: string, type: 'success' | 'info' | 'error' = 'success') => {
    const newToast: ToastMessage = {
      id: `toast-${Date.now()}-${Math.random()}`,
      title,
      text,
      type
    };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter(t => t.id !== newToast.id));
    }, 4500);
  };

  // Handle successful login or registration
  const handleAuthSuccess = async (token: string, user: UserProfile) => {
    localStorage.setItem('token', token);
    setCurrentUser(user);
    setCurrentRole(user.role);
    setLoading(true);
    
    // Fetch newly authorized user collections
    await fetchPrivateData();
    setLoading(false);
    
    triggerToast('Welcome Back', `Successfully signed in as ${user.name}.`, 'success');
    
    // Redirect based on role
    const targetTab = user.role === 'Admin' ? 'panel' : 'dashboard';
    navigate(`/${user.role.toLowerCase()}/${targetTab}`, { replace: true });
  };

  // Clear session token and reset React states
  const handleLogout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setCurrentRole('Student');
    setAllUsers([]);
    setApplications([]);
    setMessages([]);
    setActivityLogs([]);
    triggerToast('Logged Out', 'You have securely signed out of your portal.', 'info');
    navigate('/', { replace: true });
  };

  // Simulated login helper removed

  // Add listing (Recruiter flow)
  const handleAddListing = async (newListing: Internship) => {
    if (!currentUser) return;
    
    try {
      const savedListing = await internshipService.create({
        ...newListing,
        facultyApprovalStatus: 'Verified',
        facultyApprovalRemark: '',
        facultyApprovedBy: 'Faculty Coordinator (Auto-Approved)',
        facultyApprovedAt: new Date().toISOString()
      });
      
      setInternships((prev) => [savedListing, ...prev]);
      
      // Log Activity
      const newLog: ActivityLog = {
        id: `act-${Date.now()}`,
        text: `New Opportunity: ${newListing.title} was published by recruiter ${currentUser.name} at ${newListing.company}.`,
        time: 'Just now',
        role: currentRole,
        category: 'new_listing'
      };

      await activityService.create(newLog);
      setActivityLogs((prev) => [newLog, ...prev]);

      const facultyUsers = allUsers.filter((u) => u.role === 'Faculty');
      await Promise.all(
        facultyUsers.map((faculty) =>
          messageService.create({
            id: `msg-faculty-listing-${Date.now()}-${faculty.id}`,
            senderId: currentUser.id,
            senderName: currentUser.name,
            senderRole: currentRole,
            receiverId: faculty.id,
            receiverName: faculty.name,
            receiverRole: 'Faculty',
            subject: `Faculty Review Needed: ${savedListing.title}`,
            content: `A new internship listing from ${savedListing.company} requires faculty verification before it is visible to students.`,
            timestamp: 'Just now',
            read: false,
            internshipId: savedListing.id,
            internshipTitle: savedListing.title
          })
        )
      );

      triggerToast('Listing Submitted', `"${newListing.title}" sent for faculty verification before student visibility.`, 'success');
    } catch (err) {
      triggerToast('Submission Error', 'Failed to publish opportunity in database.', 'error');
    }
  };

  // Delete listing (Recruiter/Admin flow)
  const handleDeleteListing = async (listingId: string) => {
    try {
      await internshipService.delete(listingId);
      
      setInternships((prev) => prev.filter((i) => i.id !== listingId));
      
      // Log Activity
      if (currentUser) {
        const newLog: ActivityLog = {
          id: `act-${Date.now()}`,
          text: `Opportunity Closed: Internship listing was deleted by Recruiter ${currentUser.name}.`,
          time: 'Just now',
          role: currentRole,
          category: 'system'
        };

        await activityService.create(newLog);
        setActivityLogs((prev) => [newLog, ...prev]);
      }

      triggerToast('Listing Closed', 'Successfully closed the opportunity listing.', 'info');
    } catch (err) {
      triggerToast('Delete Error', 'Failed to delete listing from MongoDB.', 'error');
    }
  };

  // Apply to internship (Student flow)
  const handleApply = async (internshipId: string, coverLetter: string, resumeName: string) => {
    if (!currentUser) {
      triggerToast('Sign In Required', 'Please register or log into your account to submit applications.', 'info');
      navigate('/login');
      return;
    }

    if (currentUser.role === 'Student' && currentUser.studentProfileVerificationStatus !== 'Verified') {
      triggerToast(
        'Profile Verification Needed',
        'Faculty must verify your student profile before you can apply.',
        'error'
      );
      return;
    }
    
    const targetListing = internships.find(i => i.id === internshipId);
    if (!targetListing) return;

    const resumeUrl = currentUser.resumeUrl || '';

    const newApplication: Application = {
      id: `app-${Date.now()}`,
      studentId: currentUser.id,
      studentName: currentUser.name,
      studentEmail: currentUser.email,
      studentCollege: currentUser.college || 'Stanford University',
      internshipId: targetListing.id,
      internshipTitle: targetListing.title,
      companyName: targetListing.company,
      status: 'Applied',
      dateApplied: new Date().toISOString().slice(0, 10),
      coverLetter,
      resumeName,
      resumeUrl
    };

    try {
      const savedApp = await applicationService.create(newApplication);
      setApplications((prev) => [savedApp, ...prev]);

      // Log Activity
      const newLog: ActivityLog = {
        id: `act-${Date.now()}`,
        text: `${currentUser.name} submitted interactive application for ${targetListing.title} at ${targetListing.company}.`,
        time: 'Just now',
        role: 'Student',
        category: 'new_application'
      };

      await activityService.create(newLog);
      setActivityLogs((prev) => [newLog, ...prev]);

      // Send automated receipt message from company talent team
      const autoReceiptMessage: Message = {
        id: `msg-auto-${Date.now()}`,
        senderId: `system-recruiter-${targetListing.company.toLowerCase()}`,
        senderName: `${targetListing.company} Talent Team`,
        senderRole: 'Company',
        receiverId: currentUser.id,
        receiverName: currentUser.name,
        receiverRole: 'Student',
        subject: `Receipt: Application for ${targetListing.title}`,
        content: `Hello ${currentUser.name},\n\nWe have successfully received your portfolio cover letter and resume (${resumeName}) for our ${targetListing.title} opening here at ${targetListing.company}.\n\nOur college recruiting coordinators are auditing pipelines this week and will update statuses on your tracking board should qualifications match.\n\nBest regards,\nThe University Relations Team`,
        timestamp: 'Just now',
        read: false,
        internshipId: targetListing.id,
        internshipTitle: targetListing.title
      };

      const savedMsg = await messageService.create(autoReceiptMessage);
      setMessages((prev) => [savedMsg, ...prev]);

      triggerToast('Application Dispatched', `Submitted portfolio dossier to ${targetListing.company}. Check messages for receipt!`, 'success');
    } catch (err) {
      triggerToast('Application Failed', 'Unable to submit application to MongoDB.', 'error');
    }
  };

  // Shift candidate status (Recruiter/Admin flow)
  const handleUpdateStatus = async (appId: string, newStatus: Application['status'], offerDetails?: string) => {
    if (!currentUser) return;
    try {
      const updatedApp = await applicationService.updateStatus(appId, newStatus, offerDetails);

      setApplications((prev) =>
        prev.map((app) => (app.id === appId ? updatedApp : app))
      );

      const matchApp = applications.find(a => a.id === appId);
      if (!matchApp) return;

      // Log matching activity
      const newLog: ActivityLog = {
        id: `act-${Date.now()}`,
        text: `${currentUser.name} shifted status of ${matchApp.studentName} for the ${matchApp.internshipTitle} to "${newStatus}".`,
        time: 'Just now',
        role: currentRole,
        category: 'status_change'
      };

      await activityService.create(newLog);
      setActivityLogs((prev) => [newLog, ...prev]);

      // Dynamic Inbox Message update to candidate
      const statusUpdateMessage: Message = {
        id: `msg-status-${Date.now()}`,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderRole: currentRole,
        receiverId: matchApp.studentId,
        receiverName: matchApp.studentName,
        receiverRole: 'Student',
        subject: `Status Update: ${matchApp.internshipTitle}`,
        content: `Hello ${matchApp.studentName},\n\nThis is an automated tracking update regarding your application for the ${matchApp.internshipTitle} role.\n\nYour application status has been moved to: "${newStatus}" by reviewing recruiters.\n\n${
          newStatus === 'Offer' 
            ? `Congratulations! A formal offer letter has been uploaded to your Applications Tracker dashboard. Please review terms and details at your earliest convenience.` 
            : `Please monitor your core dashboard or message inbox for additional dialogue steps.`
        }\n\nBest of luck,\nPlacera University Career Office`,
        timestamp: 'Just now',
        read: false,
        internshipId: matchApp.internshipId,
        internshipTitle: matchApp.internshipTitle
      };

      const savedMsg = await messageService.create(statusUpdateMessage);
      setMessages((prev) => [savedMsg, ...prev]);

      triggerToast('Applicant Updated', `Candidate shifted to "${newStatus}". Dispatch receipt sent to ${matchApp.studentName}.`, 'success');
    } catch (err) {
      triggerToast('Database Error', 'Failed to update applicant state.', 'error');
    }
  };

  const handleFacultyVerification = async (
    appId: string,
    facultyVerificationStatus: 'Verified' | 'Unverified',
    facultyUnverifiedReason?: string
  ) => {
    if (!currentUser) return;
    try {
      const updated = await applicationService.verify(appId, facultyVerificationStatus, facultyUnverifiedReason);
      setApplications((prev) => prev.map((app) => (app.id === appId ? updated : app)));
      triggerToast(
        'Application Verification Updated',
        `Application marked as ${facultyVerificationStatus}.`,
        'success'
      );
    } catch (err) {
      triggerToast('Verification Error', 'Unable to update faculty verification status.', 'error');
    }
  };

  const handleRecruiterVerification = async (
    recruiterId: string,
    recruiterVerificationStatus: 'Genuine' | 'Not Genuine',
    recruiterVerificationReason?: string
  ) => {
    if (!currentUser) return;
    try {
      const updated = await userService.update(recruiterId, {
        recruiterVerificationStatus,
        recruiterVerificationReason: recruiterVerificationStatus === 'Not Genuine' ? (recruiterVerificationReason || '') : '',
        recruiterVerifiedBy: currentUser.name
      });

      setAllUsers((prev) => prev.map((user) => (user.id === recruiterId ? updated : user)));
      if (currentUser.id === recruiterId) {
        setCurrentUser(updated);
        setCurrentRole(updated.role);
      }
      triggerToast(
        'Recruiter Verification Updated',
        `Recruiter marked as ${recruiterVerificationStatus}.`,
        'success'
      );
    } catch (err) {
      triggerToast('Verification Error', 'Unable to update recruiter verification.', 'error');
    }
  };

  const handleFacultyReviewListing = async (
    listingId: string,
    facultyApprovalStatus: 'Verified' | 'Unverified',
    facultyApprovalRemark?: string
  ) => {
    if (!currentUser) return;
    try {
      const updated = await internshipService.update(listingId, {
        facultyApprovalStatus,
        facultyApprovalRemark: facultyApprovalStatus === 'Unverified' ? (facultyApprovalRemark || '') : '',
        facultyApprovedBy: currentUser.name,
        facultyApprovedAt: new Date().toISOString()
      });
      setInternships((prev) => prev.map((listing) => (listing.id === listingId ? updated : listing)));
      triggerToast('Listing Review Saved', `Listing marked as ${facultyApprovalStatus}.`, 'success');
    } catch (err) {
      triggerToast('Review Error', 'Unable to update listing faculty status.', 'error');
    }
  };

  const handleFacultyVerifyStudentProfile = async (
    studentId: string,
    studentProfileVerificationStatus: 'Pending' | 'Verified' | 'Unverified',
    studentProfileVerificationRemark?: string
  ) => {
    if (!currentUser) return;
    try {
      const updated = await userService.update(studentId, {
        studentProfileVerificationStatus,
        studentProfileVerificationRemark:
          studentProfileVerificationStatus === 'Unverified' ? (studentProfileVerificationRemark || '') : '',
        studentProfileVerifiedBy: currentUser.name
      });

      setAllUsers((prev) => prev.map((u) => (u.id === studentId ? updated : u)));
      if (currentUser.id === studentId) {
        setCurrentUser(updated);
        setCurrentRole(updated.role);
      }
      triggerToast(
        'Student Profile Updated',
        `Student profile marked as ${studentProfileVerificationStatus}.`,
        'success'
      );
    } catch (err) {
      triggerToast('Verification Error', 'Unable to update student profile verification.', 'error');
    }
  };

  // Dispatch custom messages
  const handleSendMessage = async (
    receiverId: string, 
    subject: string, 
    content: string, 
    internshipId?: string, 
    internshipTitle?: string
  ) => {
    if (!currentUser) return;
    const recipient = allUsers.find(u => u.id === receiverId) || { name: 'Institutional Lead', role: 'Company' as UserRole };

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentRole,
      receiverId,
      receiverName: recipient.name,
      receiverRole: recipient.role,
      subject,
      content,
      timestamp: 'Just now',
      read: false,
      internshipId,
      internshipTitle
    };

    try {
      const savedMsg = await messageService.create(newMsg);
      setMessages((prev) => [savedMsg, ...prev]);

      // Send activity log
      const newLog: ActivityLog = {
        id: `act-${Date.now()}`,
        text: `${currentUser.name} dispatched an inbox message regarding "${subject}" to ${recipient.name}.`,
        time: 'Just now',
        role: currentRole,
        category: 'message'
      };

      await activityService.create(newLog);
      setActivityLogs((prev) => [newLog, ...prev]);

      triggerToast('Message Sent', `Dispatched professionally to ${recipient.name}.`, 'success');
    } catch (err) {
      triggerToast('Message Failed', 'Could not save message in database.', 'error');
    }
  };

  // Mark selected message read
  const handleMarkRead = async (msgId: string) => {
    try {
      await messageService.markRead(msgId);
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, read: true } : m))
      );
    } catch (err) {
      console.error('Failed to mark message read:', err);
    }
  };

  // Profile Updates Saver
  const handleUpdateProfile = async (updatedProfile: UserProfile) => {
    try {
      const savedProfile = await userService.update(updatedProfile.id, updatedProfile);
      setAllUsers((prev) => prev.map(u => u.id === savedProfile.id ? savedProfile : u));
      setCurrentUser(savedProfile);
      triggerToast('Profile Updated', 'Biography dossiers saved to MongoDB successfully.', 'success');
    } catch (err) {
      triggerToast('Database Error', 'Could not update biographical records.', 'error');
    }
  };

  // Invite Dynamic simulated actors (Admin flow)
  const handleInviteUser = async (newUser: UserProfile & { password?: string }) => {
    try {
      const saved = await userService.invite(newUser as UserProfile);
      setAllUsers((prev) => [...prev, saved]);
      triggerToast('Academic Invited', `Successfully added coordinator/student ${newUser.name}.`, 'success');
    } catch (err) {
      triggerToast('Admin Error', 'Failed to insert actor profile.', 'error');
    }
  };

  // Remove mock actors (Admin flow)
  const handleRemoveUser = async (userId: string) => {
    try {
      await userService.remove(userId);
      setAllUsers((prev) => prev.filter(u => u.id !== userId));
      triggerToast('User Removed', 'Securely deleted active profile.', 'info');
    } catch (err) {
      triggerToast('Admin Error', 'Failed to delete actor profile.', 'error');
    }
  };

  // Update administrative user authority levels
  const handleUpdateUserRole = async (userId: string, newRole: UserRole, companyName?: string) => {
    try {
      const updated = await userService.updateRole(userId, newRole, companyName);

      setAllUsers((prev) =>
        prev.map((user) => (user.id === userId ? updated : user))
      );

      // If active user’s role was changed, update their running state
      if (currentUser && userId === currentUser.id) {
        setCurrentRole(newRole);
        setCurrentUser(updated);
      }
      triggerToast('Authority Updated', `Assigned Mode to ${newRole}.`, 'success');
    } catch (err) {
      triggerToast('Admin Error', 'Failed to update actor authority level.', 'error');
    }
  };

  // Clear live individual toast item
  const handleCloseToast = (id: string) => {
    setToasts((prev) => prev.filter(t => t.id !== id));
  };
  // Full-screen loading spinner
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-page-bg space-y-4 select-none">
        <i className="fa-solid fa-spinner fa-spin text-brand-600 text-3xl" />
        <p className="text-xs font-mono tracking-widest text-slate-400 uppercase">Loading Portal Database...</p>
      </div>
    );
  }

  // Guest State Route Switcher
  if (!currentUser) {
    return (
      <Routes>
        <Route
          path="/"
          element={
            <LandingView
              onBrowseListings={() => navigate('/guest')}
              onStartAuth={(mode) => navigate(mode === 'login' ? '/login' : '/register')}
            />
          }
        />
        <Route
          path="/login"
          element={
            <AuthView
              initialMode="login"
              onAuthSuccess={handleAuthSuccess}
              onBackToLanding={() => navigate('/')}
            />
          }
        />
        <Route
          path="/register"
          element={
            <AuthView
              initialMode="register"
              onAuthSuccess={handleAuthSuccess}
              onBackToLanding={() => navigate('/')}
            />
          }
        />
        <Route
          path="/guest"
          element={
            <div className="flex flex-col h-screen bg-page-bg font-sans max-w-[100vw] text-text-main antialiased relative">
              <header className="h-16 bg-white border-b border-brand-100 px-6 flex items-center justify-between select-none font-sans">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => navigate('/')}
                    className="text-xs font-semibold text-editorial hover:underline cursor-pointer"
                  >
                    Go Back to Home
                  </button>
                  <span className="h-4 w-px bg-cream-accent mx-2" />
                  <span className="text-[10px] font-mono tracking-widest text-[#64748B] bg-brand-50 px-2 py-0.5 rounded border border-brand-100 uppercase font-bold">
                    Guest Board (Read-only)
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate('/login')}
                    className="text-xs font-semibold text-editorial hover:underline px-3 py-1.5 cursor-pointer"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => navigate('/register')}
                    className="px-3.5 py-1.5 bg-editorial text-white hover:bg-editorial-light rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
                  >
                    Register to Apply
                  </button>
                </div>
              </header>

              <main className="flex-1 overflow-y-auto px-6 py-8">
                <div className="max-w-7xl mx-auto space-y-8">
                  <div className="p-4 bg-brand-50 border border-brand-100 rounded-2xl flex items-center justify-between text-left select-none">
                    <p className="text-xs text-brand-600 font-medium">
                      <strong>Guest Mode enabled</strong>: You can explore and research active placements opportunity grids. Set up an account or log in to submit your verified dossiers.
                    </p>
                  </div>

                  <ListingsView
                    currentRole="Student"
                    currentUser={null}
                    internships={studentVisibleInternships}
                    applications={[]}
                    allUsers={[]}
                    onAddListing={() => {}}
                    onApply={() => {}}
                    triggerToast={triggerToast}
                    listingsFilter={listingsFilter}
                    setListingsFilter={setListingsFilter}
                    onPromptAuth={() => navigate('/login')}
                    onDeleteListing={() => {}}
                    onFacultyReviewListing={() => {}}
                    onFacultyVerifyRecruiter={() => {}}
                  />
                </div>
              </main>
              
              <ToastList toasts={toasts} onCloseToast={handleCloseToast} />
            </div>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // Authenticated State View Framework
  const pathSegments = location.pathname.split('/');
  const rawTab = pathSegments[pathSegments.length - 1];
  const currentTab = rawTab === 'panel' ? 'admin' : rawTab;

  const handleTabChange = (tab: string) => {
    const targetPath = tab === 'admin' ? 'panel' : tab;
    navigate(`/${currentRole.toLowerCase()}/${targetPath}`);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-page-bg font-sans max-w-[100vw] text-text-main antialiased relative">
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={handleTabChange}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        currentRole={currentRole}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar
          currentRole={currentRole}
          currentUser={currentUser}
          onLogout={handleLogout}
          unreceivedCount={unreadMessagesCount}
          triggerToast={triggerToast}
        />
        <main className="flex-1 overflow-y-auto px-6 py-8" id="primary-main-scroll-view">
          <div className="max-w-7xl mx-auto space-y-8 select-text">
            <Routes>
              {/* Student Protected Routes */}
              <Route path="/student/dashboard" element={<RoleGuard currentUser={currentUser} allowedRoles={['Student']}><DashboardView currentRole={currentRole} currentUser={currentUser} internships={studentVisibleInternships} applications={applications} activityLogs={activityLogs} setCurrentTab={(tab) => navigate(`/student/${tab === 'admin' ? 'panel' : tab}`)} setListingsFilter={setListingsFilter} triggerToast={triggerToast} /></RoleGuard>} />
              <Route path="/student/listings" element={<RoleGuard currentUser={currentUser} allowedRoles={['Student']}><ListingsView currentRole={currentRole} currentUser={currentUser} internships={studentVisibleInternships} applications={applications} allUsers={allUsers} onAddListing={handleAddListing} onApply={handleApply} triggerToast={triggerToast} listingsFilter={listingsFilter} setListingsFilter={setListingsFilter} onDeleteListing={handleDeleteListing} onFacultyReviewListing={handleFacultyReviewListing} onFacultyVerifyRecruiter={handleRecruiterVerification} /></RoleGuard>} />
              <Route path="/student/tracker" element={<RoleGuard currentUser={currentUser} allowedRoles={['Student']}><TrackerView currentRole={currentRole} currentUser={currentUser} applications={applications} internships={studentVisibleInternships} allUsers={studentVisibleUsers} onUpdateStatus={handleUpdateStatus} onFacultyVerifyApplication={handleFacultyVerification} onFacultyVerifyRecruiter={handleRecruiterVerification} onFacultyVerifyStudentProfile={handleFacultyVerifyStudentProfile} onFacultyReviewListing={handleFacultyReviewListing} triggerToast={triggerToast} /></RoleGuard>} />
              <Route path="/student/profile" element={<RoleGuard currentUser={currentUser} allowedRoles={['Student']}><ProfileView currentUser={currentUser} onUpdateProfile={handleUpdateProfile} triggerToast={triggerToast} /></RoleGuard>} />
              <Route path="/student/messages" element={<RoleGuard currentUser={currentUser} allowedRoles={['Student']}><MessagesView currentRole={currentRole} currentUser={currentUser} messages={studentVisibleMessages} allUsers={studentVisibleUsers} applications={applications} internships={studentVisibleInternships} onSendMessage={handleSendMessage} onMarkRead={handleMarkRead} triggerToast={triggerToast} /></RoleGuard>} />

              {/* Admin Protected Routes */}
              <Route path="/admin/dashboard" element={<RoleGuard currentUser={currentUser} allowedRoles={['Admin']}><DashboardView currentRole={currentRole} currentUser={currentUser} internships={internships} applications={applications} activityLogs={activityLogs} setCurrentTab={(tab) => navigate(`/admin/${tab === 'admin' ? 'panel' : tab}`)} setListingsFilter={setListingsFilter} triggerToast={triggerToast} /></RoleGuard>} />
              <Route path="/admin/listings" element={<RoleGuard currentUser={currentUser} allowedRoles={['Admin']}><ListingsView currentRole={currentRole} currentUser={currentUser} internships={internships} applications={applications} allUsers={allUsers} onAddListing={handleAddListing} onApply={handleApply} triggerToast={triggerToast} listingsFilter={listingsFilter} setListingsFilter={setListingsFilter} onDeleteListing={handleDeleteListing} onFacultyReviewListing={handleFacultyReviewListing} onFacultyVerifyRecruiter={handleRecruiterVerification} /></RoleGuard>} />
              <Route path="/admin/tracker" element={<RoleGuard currentUser={currentUser} allowedRoles={['Admin']}><TrackerView currentRole={currentRole} currentUser={currentUser} applications={applications} internships={internships} allUsers={allUsers} onUpdateStatus={handleUpdateStatus} onFacultyVerifyApplication={handleFacultyVerification} onFacultyVerifyRecruiter={handleRecruiterVerification} onFacultyVerifyStudentProfile={handleFacultyVerifyStudentProfile} onFacultyReviewListing={handleFacultyReviewListing} triggerToast={triggerToast} /></RoleGuard>} />
              <Route path="/admin/messages" element={<RoleGuard currentUser={currentUser} allowedRoles={['Admin']}><MessagesView currentRole={currentRole} currentUser={currentUser} messages={messages} allUsers={allUsers} applications={applications} internships={internships} onSendMessage={handleSendMessage} onMarkRead={handleMarkRead} triggerToast={triggerToast} /></RoleGuard>} />
              <Route path="/admin/panel" element={<RoleGuard currentUser={currentUser} allowedRoles={['Admin']}><AdminView currentUser={currentUser} allUsers={allUsers} internships={internships} applications={applications} onInviteUser={handleInviteUser} onRemoveUser={handleRemoveUser} onUpdateUserRole={handleUpdateUserRole} triggerToast={triggerToast} /></RoleGuard>} />

              {/* Faculty Protected Routes */}
              <Route path="/faculty/dashboard" element={<RoleGuard currentUser={currentUser} allowedRoles={['Faculty']}><DashboardView currentRole={currentRole} currentUser={currentUser} internships={internships} applications={applications} activityLogs={activityLogs} setCurrentTab={(tab) => navigate(`/faculty/${tab === 'admin' ? 'panel' : tab}`)} setListingsFilter={setListingsFilter} triggerToast={triggerToast} /></RoleGuard>} />
              <Route path="/faculty/listings" element={<RoleGuard currentUser={currentUser} allowedRoles={['Faculty']}><ListingsView currentRole={currentRole} currentUser={currentUser} internships={internships} applications={applications} allUsers={allUsers} onAddListing={handleAddListing} onApply={handleApply} triggerToast={triggerToast} listingsFilter={listingsFilter} setListingsFilter={setListingsFilter} onDeleteListing={handleDeleteListing} onFacultyReviewListing={handleFacultyReviewListing} onFacultyVerifyRecruiter={handleRecruiterVerification} /></RoleGuard>} />
              <Route path="/faculty/tracker" element={<RoleGuard currentUser={currentUser} allowedRoles={['Faculty']}><TrackerView currentRole={currentRole} currentUser={currentUser} applications={applications} internships={internships} allUsers={allUsers} onUpdateStatus={handleUpdateStatus} onFacultyVerifyApplication={handleFacultyVerification} onFacultyVerifyRecruiter={handleRecruiterVerification} onFacultyVerifyStudentProfile={handleFacultyVerifyStudentProfile} onFacultyReviewListing={handleFacultyReviewListing} triggerToast={triggerToast} /></RoleGuard>} />
              <Route path="/faculty/messages" element={<RoleGuard currentUser={currentUser} allowedRoles={['Faculty']}><MessagesView currentRole={currentRole} currentUser={currentUser} messages={messages} allUsers={allUsers} applications={applications} internships={internships} onSendMessage={handleSendMessage} onMarkRead={handleMarkRead} triggerToast={triggerToast} /></RoleGuard>} />

              {/* Company Protected Routes */}
              <Route path="/company/dashboard" element={<RoleGuard currentUser={currentUser} allowedRoles={['Company']}><DashboardView currentRole={currentRole} currentUser={currentUser} internships={internships} applications={applications} activityLogs={activityLogs} setCurrentTab={(tab) => navigate(`/company/${tab === 'admin' ? 'panel' : tab}`)} setListingsFilter={setListingsFilter} triggerToast={triggerToast} /></RoleGuard>} />
              <Route path="/company/listings" element={<RoleGuard currentUser={currentUser} allowedRoles={['Company']}><ListingsView currentRole={currentRole} currentUser={currentUser} internships={internships} applications={applications} allUsers={allUsers} onAddListing={handleAddListing} onApply={handleApply} triggerToast={triggerToast} listingsFilter={listingsFilter} setListingsFilter={setListingsFilter} onDeleteListing={handleDeleteListing} onFacultyReviewListing={handleFacultyReviewListing} onFacultyVerifyRecruiter={handleRecruiterVerification} /></RoleGuard>} />
              <Route path="/company/tracker" element={<RoleGuard currentUser={currentUser} allowedRoles={['Company']}><TrackerView currentRole={currentRole} currentUser={currentUser} applications={applications} internships={internships} allUsers={allUsers} onUpdateStatus={handleUpdateStatus} onFacultyVerifyApplication={handleFacultyVerification} onFacultyVerifyRecruiter={handleRecruiterVerification} onFacultyVerifyStudentProfile={handleFacultyVerifyStudentProfile} onFacultyReviewListing={handleFacultyReviewListing} triggerToast={triggerToast} /></RoleGuard>} />
              <Route path="/company/messages" element={<RoleGuard currentUser={currentUser} allowedRoles={['Company']}><MessagesView currentRole={currentRole} currentUser={currentUser} messages={messages} allUsers={allUsers} applications={applications} internships={internships} onSendMessage={handleSendMessage} onMarkRead={handleMarkRead} triggerToast={triggerToast} /></RoleGuard>} />

              <Route path="*" element={<Navigate to={`/${currentRole.toLowerCase()}/${currentRole === 'Admin' ? 'panel' : 'dashboard'}`} replace />} />
            </Routes>
          </div>
        </main>
        <footer className="h-8 border-t border-slate-200 bg-slate-50/40 px-6 flex items-center justify-between text-[10px] text-slate-400 font-mono select-none">
          <span>PLACERA ACADEMIC PLACEMENT SERVICE V2.16</span>
          <span className="hidden sm:inline">ALL SIMULATED DATA PERSISTS SECURELY IN MONGODB DATABASE</span>
        </footer>
      </div>

      {/* Persistent AI Career Advisor Chatbot (Only for Students) */}
      {currentRole === 'Student' && (
        <CareerAdvisorChatbot
          currentUser={currentUser}
          triggerToast={triggerToast}
        />
      )}

      {/* Dynamic Toast Popup Container */}
      <ToastList toasts={toasts} onCloseToast={handleCloseToast} />
    </div>
  );
}
