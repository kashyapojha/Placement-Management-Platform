import { UserRole, UserProfile, Internship, Application, Message, ActivityLog } from '../types';

export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
export const API_ORIGIN = API_BASE.replace(/\/api\/?$/, '');

// Authenticated fetch wrapper helper
export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
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

export const authService = {
  getMe: async (): Promise<UserProfile> => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to validate active token session.');
    return res.json();
  },

  // Simulation endpoint deleted
};

export const internshipService = {
  getAll: async (): Promise<Internship[]> => {
    const res = await fetch(`${API_BASE}/internships`);
    if (!res.ok) throw new Error('Failed to fetch public internships.');
    return res.json();
  },

  create: async (newListing: Internship): Promise<Internship> => {
    const res = await fetchWithAuth(`${API_BASE}/internships`, {
      method: 'POST',
      body: JSON.stringify(newListing)
    });
    if (!res.ok) throw new Error('Backend refused job publication.');
    return res.json();
  },

  delete: async (listingId: string): Promise<void> => {
    const res = await fetchWithAuth(`${API_BASE}/internships/${listingId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Backend refused job deletion.');
  },

  update: async (listingId: string, updateData: {
    facultyApprovalStatus?: 'Verified' | 'Unverified';
    facultyApprovalRemark?: string;
    facultyApprovedBy?: string;
    facultyApprovedAt?: string;
  }): Promise<Internship> => {
    const res = await fetchWithAuth(`${API_BASE}/internships/${listingId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
    if (!res.ok) throw new Error('Listing faculty review failed.');
    return res.json();
  }
};

export const applicationService = {
  getAll: async (): Promise<Application[]> => {
    const res = await fetchWithAuth(`${API_BASE}/applications`);
    if (!res.ok) throw new Error('Failed to fetch applications.');
    return res.json();
  },

  create: async (newApplication: Application): Promise<Application> => {
    const res = await fetchWithAuth(`${API_BASE}/applications`, {
      method: 'POST',
      body: JSON.stringify(newApplication)
    });
    if (!res.ok) throw new Error('Vetting system rejected application schema.');
    return res.json();
  },

  updateStatus: async (appId: string, status: Application['status'], offerDetails?: string): Promise<Application> => {
    const res = await fetchWithAuth(`${API_BASE}/applications/${appId}`, {
      method: 'PUT',
      body: JSON.stringify({ status, offerDetails })
    });
    if (!res.ok) throw new Error('Status migration rejected.');
    return res.json();
  },

  verify: async (appId: string, facultyVerificationStatus: 'Verified' | 'Unverified', facultyUnverifiedReason?: string): Promise<Application> => {
    const res = await fetchWithAuth(`${API_BASE}/applications/${appId}/verify`, {
      method: 'PUT',
      body: JSON.stringify({ facultyVerificationStatus, facultyUnverifiedReason })
    });
    if (!res.ok) throw new Error('Application faculty verification update failed.');
    return res.json();
  }
};

export const messageService = {
  getAll: async (): Promise<Message[]> => {
    const res = await fetchWithAuth(`${API_BASE}/messages`);
    if (!res.ok) throw new Error('Failed to fetch messages.');
    return res.json();
  },

  create: async (newMessage: Message): Promise<Message> => {
    const res = await fetchWithAuth(`${API_BASE}/messages`, {
      method: 'POST',
      body: JSON.stringify(newMessage)
    });
    if (!res.ok) throw new Error('Database message rejected.');
    return res.json();
  },

  markRead: async (msgId: string): Promise<void> => {
    const res = await fetchWithAuth(`${API_BASE}/messages/${msgId}/read`, {
      method: 'PUT'
    });
    if (!res.ok) throw new Error('Failed to mark message read.');
  }
};

export const userService = {
  getAll: async (): Promise<UserProfile[]> => {
    const res = await fetchWithAuth(`${API_BASE}/users`);
    if (!res.ok) throw new Error('Failed to fetch authenticated user collections.');
    return res.json();
  },

  update: async (userId: string, updatedProfile: Partial<UserProfile>): Promise<UserProfile> => {
    const res = await fetchWithAuth(`${API_BASE}/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updatedProfile)
    });
    if (!res.ok) throw new Error('Profile save rejected.');
    return res.json();
  },

  invite: async (newUser: UserProfile): Promise<UserProfile> => {
    const res = await fetchWithAuth(`${API_BASE}/users`, {
      method: 'POST',
      body: JSON.stringify(newUser)
    });
    if (!res.ok) throw new Error('Vetting profile rejected.');
    return res.json();
  },

  remove: async (userId: string): Promise<void> => {
    const res = await fetchWithAuth(`${API_BASE}/users/${userId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Deletion rejected.');
  },

  updateRole: async (userId: string, role: UserRole, companyName?: string): Promise<UserProfile> => {
    const res = await fetchWithAuth(`${API_BASE}/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role, companyName })
    });
    if (!res.ok) throw new Error('Role rewrite rejected.');
    return res.json();
  },

  auditMatch: async (userId: string, listingId: string): Promise<{ 
    success: boolean; 
    auditText: string; 
    matchScore: number; 
    simulated: boolean;
    strongPoints?: string;
    gaps?: string;
    bioRecommendation?: string;
  }> => {
    const res = await fetchWithAuth(`${API_BASE}/users/audit-match`, {
      method: 'POST',
      body: JSON.stringify({ userId, listingId })
    });
    if (!res.ok) throw new Error('AI placement match audit failed.');
    return res.json();
  },

  chat: async (message: string, history: { role: 'user' | 'assistant'; content: string }[]): Promise<{ success: boolean; reply: string; simulated: boolean }> => {
    const res = await fetchWithAuth(`${API_BASE}/users/chat`, {
      method: 'POST',
      body: JSON.stringify({ message, history })
    });
    if (!res.ok) throw new Error('AI career advisor connection failed.');
    return res.json();
  }
};

export const activityService = {
  getAll: async (): Promise<ActivityLog[]> => {
    const res = await fetchWithAuth(`${API_BASE}/activity-logs`);
    if (!res.ok) throw new Error('Failed to fetch activity logs.');
    return res.json();
  },

  create: async (newLog: ActivityLog): Promise<ActivityLog> => {
    const res = await fetchWithAuth(`${API_BASE}/activity-logs`, {
      method: 'POST',
      body: JSON.stringify(newLog)
    });
    if (!res.ok) throw new Error('Activity log creation failed.');
    return res.json();
  }
};
