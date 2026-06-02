import mongoose, { Schema } from 'mongoose';

const InternshipSchema = new Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, required: true },
  stipend: { type: String, required: true },
  deadline: { type: String, required: true },
  description: { type: String, required: true },
  requirements: { type: [String], default: [] },
  skills: { type: [String], default: [] },
  category: { type: String, required: true, enum: ['Engineering', 'Design', 'Product', 'Marketing'] },
  logoBg: { type: String, required: true },
  postedDate: { type: String, required: true },
  facultyApprovalStatus: {
    type: String,
    enum: ['Pending', 'Verified', 'Unverified'],
    default: 'Pending'
  },
  facultyApprovalRemark: { type: String, default: '' },
  facultyApprovedBy: { type: String, default: '' },
  facultyApprovedAt: { type: String, default: '' }
}, { timestamps: true });

export const InternshipModel = mongoose.model('Internship', InternshipSchema);
export default InternshipModel;

