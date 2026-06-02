import React, { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw, KeyRound, ArrowRight } from 'lucide-react';

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

// Guest & Authentication Views
import LandingView from './components/LandingView';
import AuthView from './components/AuthView';

import { UserRole, UserProfile, Internship, Application, Message, ActivityLog, ToastMessage } from './types';

export default function App() {
  // API Endpoint Base URL
  const API_BASE = 'http://localhost:5000/api';

  // Session & Authentication State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('Student');
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  // Navigation State
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
  const [isBrowsing, setIsBrowsing] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
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
      const hasGenuineRecruiter = companyRecruiters.some((u) => u.recruiterVerificationStatus === 'Genuine');
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

  // Authenticated fetch wrapper helper
  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    const headers = new Headers(options.headers || {});
    
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    return fetch(url, {
      ...options,
      headers
    });
  };

  // Perform session check and fetch internships (which are public) on mount
  useEffect(() => {
    const checkSessionAndFetchPublicData = async () => {
      try {
        // Anyone can fetch public internships
        const internshipsRes = await fetch(`${API_BASE}/internships`);
        if (internshipsRes.ok) {
          const listings = await internshipsRes.json();
          setInternships(listings);
        }

        const token = localStorage.getItem('token');
        if (token) {
          // Validate JWT session
          const userRes = await fetch(`${API_BASE}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (userRes.ok) {
            const userObj: UserProfile = await userRes.json();
            setCurrentUser(userObj);
            setCurrentRole(userObj.role);
            
            // Load remaining private data collections
            await fetchPrivateData();
          } else {
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
      const [usersRes, applicationsRes, messagesRes, logsRes] = await Promise.all([
        fetchWithAuth(`${API_BASE}/users`),
        fetchWithAuth(`${API_BASE}/applications`),
        fetchWithAuth(`${API_BASE}/messages`),
        fetchWithAuth(`${API_BASE}/activity-logs`)
      ]);

      if (usersRes.ok) {
        const users = await usersRes.json();
        setAllUsers(users);
        if (currentUser) {
          const refreshedCurrentUser = users.find((u: UserProfile) => u.id === currentUser.id);
          if (refreshedCurrentUser) {
            setCurrentUser(refreshedCurrentUser);
            setCurrentRole(refreshedCurrentUser.role);
          }
        }
      }
      if (applicationsRes.ok) setApplications(await applicationsRes.json());
      if (messagesRes.ok) setMessages(await messagesRes.json());
      if (logsRes.ok) setActivityLogs(await logsRes.json());
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
    setAuthMode(null);
    setIsBrowsing(false);
    setCurrentTab('dashboard');
    setLoading(true);
    
    // Fetch newly authorized user collections
    await fetchPrivateData();
    setLoading(false);
    
    triggerToast('Welcome Back', `Successfully signed in as ${user.name}.`, 'success');
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
    setCurrentTab('dashboard');
    setIsBrowsing(false);
    setAuthMode(null);
    triggerToast('Logged Out', 'You have securely signed out of your portal.', 'info');
  };

  // Add listing (Recruiter flow)
  const handleAddListing = async (newListing: Internship) => {
    if (!currentUser) return;
    try {
      const res = await fetchWithAuth(`${API_BASE}/internships`, {
        method: 'POST',
        body: JSON.stringify({
          ...newListing,
          facultyApprovalStatus: 'Pending',
          facultyApprovalRemark: '',
          facultyApprovedBy: '',
          facultyApprovedAt: ''
        })
      });
      if (!res.ok) throw new Error('Backend refused job publication.');
      
      const savedListing = await res.json();
      setInternships((prev) => [savedListing, ...prev]);
      
      // Log Activity
      const newLog: ActivityLog = {
        id: `act-${Date.now()}`,
        text: `New Opportunity: ${newListing.title} was published by recruiter ${currentUser.name} at ${newListing.company}.`,
        time: 'Just now',
        role: currentRole,
        category: 'new_listing'
      };

      await fetchWithAuth(`${API_BASE}/activity-logs`, {
        method: 'POST',
        body: JSON.stringify(newLog)
      });
      setActivityLogs((prev) => [newLog, ...prev]);

      const facultyUsers = allUsers.filter((u) => u.role === 'Faculty');
      await Promise.all(
        facultyUsers.map((faculty) =>
          fetchWithAuth(`${API_BASE}/messages`, {
            method: 'POST',
            body: JSON.stringify({
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
      const res = await fetchWithAuth(`${API_BASE}/internships/${listingId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Backend refused job deletion.');
      
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

        await fetchWithAuth(`${API_BASE}/activity-logs`, {
          method: 'POST',
          body: JSON.stringify(newLog)
        });
        setActivityLogs((prev) => [newLog, ...prev]);
      }

      triggerToast('Listing Closed', 'Successfully closed the opportunity listing.', 'info');
    } catch (err) {
      triggerToast('Delete Error', 'Failed to delete listing from MongoDB.', 'error');
    }
  };

  // Apply to internship (Student flow)
  const handleApply = async (internshipId: string, coverLetter: string, resumeName: string) => {
    if (currentUser.role === 'Student' && currentUser.studentProfileVerificationStatus !== 'Verified') {
      triggerToast(
        'Profile Verification Needed',
        'Faculty must verify your student profile before you can apply.',
        'error'
      );
      return;
    }

    if (!currentUser) {
      triggerToast('Sign In Required', 'Please register or log into your account to submit applications.', 'info');
      setAuthMode('login');
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
      const res = await fetchWithAuth(`${API_BASE}/applications`, {
        method: 'POST',
        body: JSON.stringify(newApplication)
      });
      if (!res.ok) throw new Error('Vetting system rejected application schema.');
      
      const savedApp = await res.json();
      setApplications((prev) => [savedApp, ...prev]);

      // Log Activity
      const newLog: ActivityLog = {
        id: `act-${Date.now()}`,
        text: `${currentUser.name} submitted interactive application for ${targetListing.title} at ${targetListing.company}.`,
        time: 'Just now',
        role: 'Student',
        category: 'new_application'
      };

      await fetchWithAuth(`${API_BASE}/activity-logs`, {
        method: 'POST',
        body: JSON.stringify(newLog)
      });
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

      const msgRes = await fetchWithAuth(`${API_BASE}/messages`, {
        method: 'POST',
        body: JSON.stringify(autoReceiptMessage)
      });
      if (msgRes.ok) {
        const savedMsg = await msgRes.json();
        setMessages((prev) => [savedMsg, ...prev]);
      }

      triggerToast('Application Dispatched', `Submitted portfolio dossier to ${targetListing.company}. Check messages for receipt!`, 'success');
    } catch (err) {
      triggerToast('Application Failed', 'Unable to submit application to MongoDB.', 'error');
    }
  };

  // Shift candidate status (Recruiter/Admin flow)
  const handleUpdateStatus = async (appId: string, newStatus: Application['status'], offerDetails?: string) => {
    if (!currentUser) return;
    try {
      const res = await fetchWithAuth(`${API_BASE}/applications/${appId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus, offerDetails })
      });
      if (!res.ok) throw new Error('Status migration rejected.');
      
      const updatedApp = await res.json();

      setApplications((prev) =>
        prev.map((app) => (app.id === appId ? { ...app, status: newStatus, offerDetails } : app))
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

      await fetchWithAuth(`${API_BASE}/activity-logs`, {
        method: 'POST',
        body: JSON.stringify(newLog)
      });
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
        }\n\nBest of luck,\nIncipio University Recruiting Office`,
        timestamp: 'Just now',
        read: false,
        internshipId: matchApp.internshipId,
        internshipTitle: matchApp.internshipTitle
      };

      const msgRes = await fetchWithAuth(`${API_BASE}/messages`, {
        method: 'POST',
        body: JSON.stringify(statusUpdateMessage)
      });
      if (msgRes.ok) {
        const savedMsg = await msgRes.json();
        setMessages((prev) => [savedMsg, ...prev]);
      }

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
      const payload = {
        facultyVerificationStatus,
        facultyUnverifiedReason: facultyVerificationStatus === 'Unverified' ? (facultyUnverifiedReason || '') : '',
        facultyVerifiedBy: currentUser.name,
        facultyVerifiedAt: new Date().toISOString()
      };
      const res = await fetchWithAuth(`${API_BASE}/applications/${appId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Faculty verification failed.');

      const updated = await res.json();
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
      const res = await fetchWithAuth(`${API_BASE}/users/${recruiterId}`, {
        method: 'PUT',
        body: JSON.stringify({
          recruiterVerificationStatus,
          recruiterVerificationReason: recruiterVerificationStatus === 'Not Genuine' ? (recruiterVerificationReason || '') : '',
          recruiterVerifiedBy: currentUser.name
        })
      });
      if (!res.ok) throw new Error('Recruiter verification failed.');

      const updated = await res.json();
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
      const res = await fetchWithAuth(`${API_BASE}/internships/${listingId}`, {
        method: 'PUT',
        body: JSON.stringify({
          facultyApprovalStatus,
          facultyApprovalRemark: facultyApprovalStatus === 'Unverified' ? (facultyApprovalRemark || '') : '',
          facultyApprovedBy: currentUser.name,
          facultyApprovedAt: new Date().toISOString()
        })
      });
      if (!res.ok) throw new Error('Listing faculty review failed.');
      const updated = await res.json();
      setInternships((prev) => prev.map((listing) => (listing.id === listingId ? updated : listing)));
      triggerToast('Listing Review Saved', `Listing marked as ${facultyApprovalStatus}.`, 'success');
    } catch (err) {
      triggerToast('Review Error', 'Unable to update listing faculty status.', 'error');
    }
  };

  const handleFacultyVerifyStudentProfile = async (
    studentId: string,
    studentProfileVerificationStatus: 'Verified' | 'Unverified',
    studentProfileVerificationRemark?: string
  ) => {
    if (!currentUser) return;
    try {
      const res = await fetchWithAuth(`${API_BASE}/users/${studentId}`, {
        method: 'PUT',
        body: JSON.stringify({
          studentProfileVerificationStatus,
          studentProfileVerificationRemark:
            studentProfileVerificationStatus === 'Unverified' ? (studentProfileVerificationRemark || '') : '',
          studentProfileVerifiedBy: currentUser.name
        })
      });
      if (!res.ok) throw new Error('Student profile verification failed.');

      const updated = await res.json();
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
      const res = await fetchWithAuth(`${API_BASE}/messages`, {
        method: 'POST',
        body: JSON.stringify(newMsg)
      });
      if (!res.ok) throw new Error('Database message rejected.');
      
      const savedMsg = await res.json();
      setMessages((prev) => [savedMsg, ...prev]);

      // Send activity log
      const newLog: ActivityLog = {
        id: `act-${Date.now()}`,
        text: `${currentUser.name} dispatched an inbox message regarding "${subject}" to ${recipient.name}.`,
        time: 'Just now',
        role: currentRole,
        category: 'message'
      };

      await fetchWithAuth(`${API_BASE}/activity-logs`, {
        method: 'POST',
        body: JSON.stringify(newLog)
      });
      setActivityLogs((prev) => [newLog, ...prev]);

      triggerToast('Message Sent', `Dispatched professionally to ${recipient.name}.`, 'success');
    } catch (err) {
      triggerToast('Message Failed', 'Could not save message in database.', 'error');
    }
  };

  // Mark selected message read
  const handleMarkRead = async (msgId: string) => {
    try {
      const res = await fetchWithAuth(`${API_BASE}/messages/${msgId}/read`, {
        method: 'PUT'
      });
      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, read: true } : m))
        );
      }
    } catch (err) {
      console.error('Failed to mark message read:', err);
    }
  };

  // Profile Updates Saver
  const handleUpdateProfile = async (updatedProfile: UserProfile) => {
    try {
      const res = await fetchWithAuth(`${API_BASE}/users/${updatedProfile.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedProfile)
      });
      if (!res.ok) throw new Error('Profile save rejected.');
      
      const savedProfile = await res.json();
      setAllUsers((prev) => prev.map(u => u.id === savedProfile.id ? savedProfile : u));
      setCurrentUser(savedProfile);
      triggerToast('Profile Updated', 'Biography dossiers saved to MongoDB successfully.', 'success');
    } catch (err) {
      triggerToast('Database Error', 'Could not update biographical records.', 'error');
    }
  };

  // Invite Dynamic simulated actors (Admin flow)
  const handleInviteUser = async (newUser: UserProfile) => {
    try {
      const res = await fetchWithAuth(`${API_BASE}/users`, {
        method: 'POST',
        body: JSON.stringify(newUser)
      });
      if (!res.ok) throw new Error('Vetting profile rejected.');
      
      const saved = await res.json();
      setAllUsers((prev) => [...prev, saved]);
      triggerToast('Academic Invited', `Successfully added coordinator/student ${newUser.name}.`, 'success');
    } catch (err) {
      triggerToast('Admin Error', 'Failed to insert actor profile.', 'error');
    }
  };

  // Remove mock actors (Admin flow)
  const handleRemoveUser = async (userId: string) => {
    try {
      const res = await fetchWithAuth(`${API_BASE}/users/${userId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Deletion rejected.');
      
      setAllUsers((prev) => prev.filter(u => u.id !== userId));
      triggerToast('User Removed', 'Securely deleted active profile.', 'info');
    } catch (err) {
      triggerToast('Admin Error', 'Failed to delete actor profile.', 'error');
    }
  };

  // Update administrative user authority levels
  const handleUpdateUserRole = async (userId: string, newRole: UserRole, companyName?: string) => {
    try {
      const res = await fetchWithAuth(`${API_BASE}/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole, companyName })
      });
      if (!res.ok) throw new Error('Role rewrite rejected.');
      
      const updated = await res.json();

      setAllUsers((prev) =>
        prev.map((user) => (user.id === userId ? updated : user))
      );

      // If active userG«÷s role was changed, update their running state
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
      <div className="flex flex-col items-center justify-center h-screen bg-page-bg space-y-4">
        <RefreshCw className="animate-spin text-editorial-light" size={40} />
        <p className="text-xs font-mono tracking-widest text-[#94A3B8] uppercase">Loading Portal Database...</p>
      </div>
    );
  }

  // GUEST STATE ROUTING
  if (!currentUser) {
    if (authMode) {
      return (
        <AuthView 
          initialMode={authMode} 
          onAuthSuccess={handleAuthSuccess} 
          onBackToLanding={() => setAuthMode(null)} 
        />
      );
    }
    
    if (isBrowsing) {
      return (
        <div className="flex flex-col h-screen bg-page-bg font-sans max-w-[100vw] text-text-main antialiased relative">
          {/* Guest browsing top bar header */}
          <header className="h-16 bg-white border-b border-[#F1F0EC] px-6 flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsBrowsing(false)}
                className="text-xs font-semibold text-editorial hover:underline cursor-pointer"
              >
                GÂ… Back to Home
              </button>
              <span className="h-4 w-px bg-cream-accent mx-2" />
              <span className="text-[10px] font-mono tracking-widest text-[#64748B] bg-[#F9F8F6] px-2 py-0.5 rounded border border-[#E5E2DE] uppercase">
                Guest Board (Read-only)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setAuthMode('login')}
                className="text-xs font-semibold text-editorial hover:underline px-3 py-1.5 cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => setAuthMode('register')}
                className="px-3.5 py-1.5 bg-editorial text-white hover:bg-editorial-light rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                Register to Apply
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto px-6 py-8">
            <div className="max-w-7xl mx-auto space-y-8">
              <div className="p-4 bg-brand-50 border border-brand-100 rounded-2xl flex items-center justify-between text-left">
                <p className="text-xs text-editorial-light font-medium">
                  <strong>Guest Mode enabled</strong>: You can explore and research active internships opportunity grids. Set up an account or log in to submit your verified dossiers.
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
                onPromptAuth={() => setAuthMode('login')}
                onDeleteListing={() => {}}
                onFacultyReviewListing={() => {}}
                onFacultyVerifyRecruiter={() => {}}
              />
            </div>
          </main>
          
          <ToastList toasts={toasts} onCloseToast={handleCloseToast} />
        </div>
      );
    }

    return (
      <LandingView 
        onBrowseListings={() => setIsBrowsing(true)} 
        onStartAuth={(mode) => setAuthMode(mode)} 
      />
    );
  }

  // AUTHENTICATED USER ENVIRONMENT
  return (
    <div className="flex h-screen overflow-hidden bg-page-bg font-sans max-w-[100vw] text-text-main antialiased relative">
      
      {/* Collapsible Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        currentRole={currentRole}
      />

      {/* Main Right panel container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top bar controls */}
        <TopBar
          currentRole={currentRole}
          currentUser={currentUser}
          onLogout={handleLogout}
          unreceivedCount={unreadMessagesCount}
          triggerToast={triggerToast}
        />

        {/* Content Container (Scrollable) */}
        <main className="flex-1 overflow-y-auto px-6 py-8" id="primary-main-scroll-view">
          <div className="max-w-7xl mx-auto space-y-8 select-text">
            
            {/* COMPONENT VIEWS DISPATCHER WITH ACCORDANCE PRIVILEGES */}
            {currentTab === 'dashboard' && (
              <DashboardView
                currentRole={currentRole}
                currentUser={currentUser}
                internships={currentRole === 'Student' ? studentVisibleInternships : internships}
                applications={applications}
                activityLogs={activityLogs}
                setCurrentTab={setCurrentTab}
                setListingsFilter={setListingsFilter}
                triggerToast={triggerToast}
              />
            )}

            {currentTab === 'listings' && (
              <ListingsView
                currentRole={currentRole}
                currentUser={currentUser}
                internships={currentRole === 'Student' ? studentVisibleInternships : internships}
                applications={applications}
                allUsers={allUsers}
                onAddListing={handleAddListing}
                onApply={handleApply}
                triggerToast={triggerToast}
                listingsFilter={listingsFilter}
                setListingsFilter={setListingsFilter}
                onDeleteListing={handleDeleteListing}
                onFacultyReviewListing={handleFacultyReviewListing}
                onFacultyVerifyRecruiter={handleRecruiterVerification}
              />
            )}

            {currentTab === 'tracker' && (
              <TrackerView
                currentRole={currentRole}
                currentUser={currentUser}
                applications={applications}
                internships={currentRole === 'Student' ? studentVisibleInternships : internships}
                allUsers={currentRole === 'Student' ? studentVisibleUsers : allUsers}
                onUpdateStatus={handleUpdateStatus}
                onFacultyVerifyApplication={handleFacultyVerification}
                onFacultyVerifyRecruiter={handleRecruiterVerification}
                onFacultyVerifyStudentProfile={handleFacultyVerifyStudentProfile}
                onFacultyReviewListing={handleFacultyReviewListing}
                triggerToast={triggerToast}
              />
            )}

            {currentTab === 'profile' && (
              <ProfileView
                currentUser={currentUser}
                onUpdateProfile={handleUpdateProfile}
                triggerToast={triggerToast}
              />
            )}

            {currentTab === 'messages' && (
              <MessagesView
                currentRole={currentRole}
                currentUser={currentUser}
                messages={currentRole === 'Student' ? studentVisibleMessages : messages}
                allUsers={currentRole === 'Student' ? studentVisibleUsers : allUsers}
                applications={applications}
                internships={currentRole === 'Student' ? studentVisibleInternships : internships}
                onSendMessage={handleSendMessage}
                onMarkRead={handleMarkRead}
                triggerToast={triggerToast}
              />
            )}

            {/* Admin Panel tab safety guard */}
            {currentTab === 'admin' && (
              currentRole === 'Admin' ? (
                <AdminView
                  currentUser={currentUser}
                  allUsers={allUsers}
                  internships={internships}
                  applications={applications}
                  onInviteUser={handleInviteUser}
                  onRemoveUser={handleRemoveUser}
                  onUpdateUserRole={handleUpdateUserRole}
                  triggerToast={triggerToast}
                />
              ) : (
                <div className="bg-cream-bg rounded-2xl max-w-xl mx-auto border border-amber-300 p-8 shadow-sm text-center space-y-6 fade-in-up">
                  <div className="h-12 w-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200">
                    <KeyRound size={20} className="animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="font-display font-semibold text-lg text-editorial">
                      Academic Administrator Credentials Required
                    </h2>
                    <p className="text-xs text-gray-500 leading-relaxed font-sans max-w-md mx-auto">
                      You are trying to reach the university oversight panel as a <strong className="text-editorial">"{currentRole}"</strong>. Only registered Coordinators carry invitation permissions.
                    </p>
                  </div>
                </div>
              )
            )}

          </div>
        </main>
        
        {/* Soft, minimal footer */}
        <footer className="h-8 border-t border-[#ecece0]/50 bg-cream-bg/40 px-6 flex items-center justify-between text-[10px] text-gray-400 font-mono select-none">
          <span>INCIPIO ACADEMIC CAREER SERVICE V2.16</span>
          <span className="hidden sm:inline">ALL SIMULATED DATA PERSISTS SECURELY IN MONGODB DATABASE</span>
        </footer>

      </div>

      {/* Dynamic Toast Popup Container */}
      <ToastList toasts={toasts} onCloseToast={handleCloseToast} />

    </div>
  );
}

