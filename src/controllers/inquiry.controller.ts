import { Request, Response } from 'express';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import Inquiry, { IInquiry } from '../models/inquiry.model';
import { sendQueryEmail } from '../services/email.service';

const FALLBACK_INQUIRY_PATH = path.join(__dirname, '..', 'inquiries_fallback.json');

const readFallbackInquiries = (): IInquiry[] => {
  try {
    if (fs.existsSync(FALLBACK_INQUIRY_PATH)) {
      const raw = fs.readFileSync(FALLBACK_INQUIRY_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading fallback inquiries:', err);
  }
  return [];
};

const writeFallbackInquiries = (data: any[]) => {
  try {
    fs.writeFileSync(FALLBACK_INQUIRY_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing fallback inquiries:', err);
  }
};

const isMongoConnected = () => mongoose.connection.readyState === 1;

export const createInquiry = async (req: Request, res: Response) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!email || !message) {
      return res.status(400).json({ message: 'Email and message are required' });
    }

    const data: IInquiry = {
      type: 'contact',
      email,
      name,
      subject: subject || 'Contact Request',
      message
    };

    // Dispatch email asynchronously in background
    sendQueryEmail(name || 'Customer', email, subject || 'Contact Request', message)
      .then(success => console.log(`[Inquiry] Email query sent: ${success}`))
      .catch(err => console.error('[Inquiry] Email query failed:', err));

    if (isMongoConnected()) {
      const newInquiry = new Inquiry(data);
      await newInquiry.save();
      return res.status(201).json(newInquiry);
    } else {
      const inquiries = readFallbackInquiries();
      const newInquiry = {
        _id: new mongoose.Types.ObjectId().toString(),
        createdAt: new Date().toISOString(),
        ...data
      };
      inquiries.push(newInquiry);
      writeFallbackInquiries(inquiries);
      return res.status(201).json(newInquiry);
    }
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const subscribeNewsletter = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const data: IInquiry = {
      type: 'newsletter',
      email
    };

    if (isMongoConnected()) {
      const newInquiry = new Inquiry(data);
      await newInquiry.save();
      return res.status(201).json(newInquiry);
    } else {
      const inquiries = readFallbackInquiries();
      // Check if already subscribed
      const alreadySubbed = inquiries.some(i => i.type === 'newsletter' && i.email.toLowerCase() === email.toLowerCase());
      if (alreadySubbed) {
        return res.status(200).json({ message: 'Already subscribed' });
      }

      const newInquiry = {
        _id: new mongoose.Types.ObjectId().toString(),
        createdAt: new Date().toISOString(),
        ...data
      };
      inquiries.push(newInquiry);
      writeFallbackInquiries(inquiries);
      return res.status(201).json(newInquiry);
    }
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const getInquiries = async (req: Request, res: Response) => {
  try {
    if (isMongoConnected()) {
      const inquiries = await Inquiry.find().sort({ createdAt: -1 });
      return res.json(inquiries);
    } else {
      const inquiries = readFallbackInquiries();
      // Sort newest first
      inquiries.sort((a, b) => new Date((b as any).createdAt).getTime() - new Date((a as any).createdAt).getTime());
      return res.json(inquiries);
    }
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};
