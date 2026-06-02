import { Request, Response } from 'express';
import ApplicationModel from '../models/Application.js';
import cloudinary from '../config/cloudinary.js';
import fs from 'fs';

export const getApplications = async (req: Request, res: Response) => {
  try {
    const apps = await ApplicationModel.find({}).sort({ createdAt: -1 });
    res.json(apps);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createApplication = async (req: Request, res: Response) => {
  try {
    const newApp = new ApplicationModel(req.body);
    await newApp.save();
    res.status(201).json(newApp);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateApplication = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, offerDetails } = req.body;
    const updateObj: any = { status };
    if (offerDetails !== undefined) {
      updateObj.offerDetails = offerDetails;
    }
    const updated = await ApplicationModel.findOneAndUpdate({ id }, updateObj, { new: true });
    if (!updated) return res.status(404).json({ error: 'Application not found' });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
export const uploadResumePdf = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded or invalid file format.' });
    }

    const hasCloudinary = 
      process.env.CLOUDINARY_CLOUD_NAME && 
      process.env.CLOUDINARY_API_KEY && 
      process.env.CLOUDINARY_API_SECRET;

    if (!hasCloudinary) {
      const publicUrl = `/uploads/${req.file.filename}`;
      return res.json({ 
        success: true, 
        filename: req.file.originalname, 
        url: publicUrl,
        provider: 'local'
      });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'resumes',
      resource_type: 'image',
      use_filename: true,
      unique_filename: true,
      access_mode: 'public'
    });

    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.json({ 
      success: true, 
      filename: req.file.originalname, 
      url: result.secure_url,
      provider: 'cloudinary'
    });
  } catch (error: any) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({ error: error.message });
  }
};
