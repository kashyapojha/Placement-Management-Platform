import { Request, Response } from 'express';
import InternshipModel from '../models/Internship.js';

export const getInternships = async (req: Request, res: Response) => {
  try {
    const listings = await InternshipModel.find({}).sort({ createdAt: -1 });
    res.json(listings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createInternship = async (req: Request, res: Response) => {
  try {
    const newListing = new InternshipModel(req.body);
    await newListing.save();
    res.status(201).json(newListing);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateInternship = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      facultyApprovalStatus,
      facultyApprovalRemark,
      facultyApprovedBy,
      facultyApprovedAt
    } = req.body;
    const updateObj: any = {};
    if (facultyApprovalStatus !== undefined) updateObj.facultyApprovalStatus = facultyApprovalStatus;
    if (facultyApprovalRemark !== undefined) updateObj.facultyApprovalRemark = facultyApprovalRemark;
    if (facultyApprovedBy !== undefined) updateObj.facultyApprovedBy = facultyApprovedBy;
    if (facultyApprovedAt !== undefined) updateObj.facultyApprovedAt = facultyApprovedAt;
    if (Object.keys(updateObj).length === 0) {
      return res.status(400).json({ error: 'No listing fields provided to update' });
    }

    const updated = await InternshipModel.findOneAndUpdate({ id }, updateObj, { new: true });
    if (!updated) return res.status(404).json({ error: 'Internship listing not found' });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteInternship = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await InternshipModel.findOneAndDelete({ id });
    if (!deleted) return res.status(404).json({ error: 'Internship listing not found' });
    res.json({ success: true, message: 'Internship listing deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

