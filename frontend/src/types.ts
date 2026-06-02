export type UserRole = 'Admin' | 'Company' | 'Student' | 'Faculty';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyName?: string;
  recruiterVerificationStatus?: 'Pending' | 'Genuine' | 'Not Genuine';
  recruiterVerificationReason?: string;
  recruiterVerifiedBy?: string;
  studentProfileVerificationStatus?: 'Verified' | 'Unverified';
  studentProfileVerificationRemark?: string;
  studentProfileVerifiedBy?: string;
  avatarUrl?: string; // or initials
  bio?: string;
  skills?: string[];
  resumeUrl?: string;
  resumeName?: string;
  college?: string;
  graduationYear?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  xUrl?: string;
}

export interface Internship {
  id: string;
  title: string;
  company: string;
  location: string;
  stipend: string;
  deadline: string;
  description: string;
  requirements: string[];
  skills: string[];
  category: 'Engineering' | 'Design' | 'Product' | 'Marketing';
  logoBg: string; // Tailwind bg class for aesthetic logo container
  postedDate: string;
  facultyApprovalStatus?: 'Pending' | 'Verified' | 'Unverified';
  facultyApprovalRemark?: string;
  facultyApprovedBy?: string;
  facultyApprovedAt?: string;
}

export interface Application {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentCollege?: string;
  internshipId: string;
  internshipTitle: string;
  companyName: string;
  status: 'Applied' | 'Shortlisted' | 'Interview' | 'Offer' | 'Rejected';
  dateApplied: string;
  coverLetter?: string;
  resumeName?: string;
  resumeUrl?: string;
  offerDetails?: string;
  interviewsCount?: number;
  facultyVerificationStatus?: 'Pending' | 'Verified' | 'Unverified';
  facultyUnverifiedReason?: string;
  facultyVerifiedBy?: string;
  facultyVerifiedAt?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  receiverId: string;
  receiverName: string;
  receiverRole: UserRole;
  subject: string;
  content: string;
  timestamp: string;
  read: boolean;
  internshipId?: string;
  internshipTitle?: string;
  createdAt?: string;
}

export interface ActivityLog {
  id: string;
  text: string;
  time: string;
  role: UserRole;
  category: 'status_change' | 'new_listing' | 'new_application' | 'message' | 'system';
}

export interface ToastMessage {
  id: string;
  title: string;
  text: string;
  type: 'success' | 'info' | 'error';
}

