import mongoose, { Schema } from 'mongoose';

const UserProfileSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['Admin', 'Company', 'Student', 'Faculty'] },
  companyName: { type: String },
  recruiterVerificationStatus: {
    type: String,
    enum: ['Pending', 'Genuine', 'Not Genuine'],
    default: 'Pending'
  },
  recruiterVerificationReason: { type: String, default: '' },
  recruiterVerifiedBy: { type: String, default: '' },
  studentProfileVerificationStatus: {
    type: String,
    enum: ['Verified', 'Unverified'],
    default: 'Unverified'
  },
  studentProfileVerificationRemark: { type: String, default: '' },
  studentProfileVerifiedBy: { type: String, default: '' },
  avatarUrl: { type: String },
  bio: { type: String, default: '' },
  skills: { type: [String], default: [] },
  resumeUrl: { type: String, default: '' },
  resumeName: { type: String, default: '' },
  college: { type: String, default: '' },
  graduationYear: { type: String, default: '' },
  portfolioUrl: { type: String, default: '' },
  githubUrl: { type: String, default: '' },
  linkedinUrl: { type: String, default: '' },
  xUrl: { type: String, default: '' }
}, { timestamps: true });

export const UserProfileModel = mongoose.model('UserProfile', UserProfileSchema);
export default UserProfileModel;

