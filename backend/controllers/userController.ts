import { Request, Response } from 'express';
import UserProfileModel from '../models/User.js';
import cloudinary from '../config/cloudinary.js';
import fs from 'fs';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await UserProfileModel.find({});
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const updated = await UserProfileModel.findOneAndUpdate({ id }, updateData, { new: true });
    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role, companyName } = req.body;
    const updated = await UserProfileModel.findOneAndUpdate(
      { id }, 
      { role, companyName: role === 'Company' ? companyName : undefined }, 
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const newUser = new UserProfileModel(req.body);
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await UserProfileModel.findOneAndDelete({ id });
    if (!deleted) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, message: 'User deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const uploadAvatarImage = async (req: Request, res: Response) => {
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
        url: publicUrl,
        provider: 'local'
      });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'avatars',
      resource_type: 'image',
      transformation: [
        { width: 250, height: 250, crop: 'fill', gravity: 'face' }
      ],
      public_id: `avatar-${Date.now()}`
    });

    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.json({ 
      success: true, 
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

export const enhanceBio = async (req: Request, res: Response) => {
  try {
    const { bio } = req.body;
    if (!bio) {
      return res.status(400).json({ error: 'Bio content is required for enhancement.' });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      const words = bio.trim().split(/\s+/);
      let enhanced = bio;
      if (words.length > 5) {
        enhanced = `As a dedicated professional, I specialize in leveraging modern technologies to build scalable, high-performance solutions. Specifically, I am passionate about: ${bio.trim().replace(/^\w/, (c: string) => c.toLowerCase())} With a strong focus on collaboration and delivering premium quality, I continuously strive to grow my skillset and drive impactful results.`;
      } else {
        enhanced = `Driven and detail-oriented professional with a strong interest in technology and software development, seeking to leverage skills in building impactful solutions.`;
      }
      return res.json({
        success: true,
        enhancedBio: enhanced,
        simulated: true
      });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a professional resume writer and career coach. Your task is to enhance, polish, and professionally rewrite the user\'s brief professional biography/elevator pitch. Keep the response concise (2-4 sentences), highly professional, engaging, and in first-person format. Do not add any preamble, conversational filler, or introductory/concluding remarks. Return only the enhanced bio text.'
          },
          {
            role: 'user',
            content: bio
          }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const enhancedBio = data.choices?.[0]?.message?.content?.trim();
    
    if (!enhancedBio) {
      throw new Error('Received empty response from Groq API.');
    }

    return res.json({
      success: true,
      enhancedBio,
      simulated: false
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
