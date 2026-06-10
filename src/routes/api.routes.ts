import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { 
  getProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} from '../controllers/product.controller';
import { 
  createInquiry, 
  subscribeNewsletter, 
  getInquiries 
} from '../controllers/inquiry.controller';
import { sendOrderEmail } from '../services/email.service';

const router = Router();

import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer Storage in Memory
const storage = multer.memoryStorage();

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images (jpeg, jpg, png, webp) are allowed'));
  }
});

// File upload route (with dynamic Cloudinary vs Local disk fallback)
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Fallback to local files if Cloudinary is not configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.log('[Upload] Cloudinary config missing. Falling back to local storage...');
      
      const uploadDir = path.join(process.cwd(), 'public/uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(req.file.originalname);
      const filename = 'img-' + uniqueSuffix + ext;
      const filepath = path.join(uploadDir, filename);

      // Save buffer to file
      fs.writeFileSync(filepath, req.file.buffer);

      const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
      const fileUrl = `${backendUrl}/uploads/${filename}`;
      return res.status(201).json({ url: fileUrl });
    }

    // Stream buffer directly to Cloudinary
    console.log('[Upload] Streaming file buffer to Cloudinary...');
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'sita_seta_uploads' },
      (error, result) => {
        if (error) {
          console.error('[Cloudinary] Stream upload failed:', error);
          return res.status(500).json({ message: 'Cloudinary upload failed: ' + error.message });
        }
        if (!result) {
          return res.status(500).json({ message: 'Cloudinary upload failed: empty response' });
        }
        console.log('[Cloudinary] Secure URL generated:', result.secure_url);
        return res.status(201).json({ url: result.secure_url });
      }
    );

    uploadStream.end(req.file.buffer);

  } catch (error: any) {
    console.error('[Upload] Route error:', error);
    return res.status(500).json({ message: error.message });
  }
});

// Product catalog routes
router.get('/products', getProducts);
router.get('/products/:id', getProductById);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

// Customer actions
router.post('/contact', createInquiry);
router.post('/newsletter', subscribeNewsletter);

// Simulated Order Submission Route
router.post('/orders', async (req, res) => {
  try {
    const { email, items, total } = req.body;
    if (!email || !items || !total) {
      return res.status(400).json({ message: 'Email, items, and total are required' });
    }
    
    // Dispatch order summary email asynchronously in background
    sendOrderEmail(email, items, total)
      .then(success => console.log(`[Orders] Order notification email dispatched: ${success}`))
      .catch(err => console.error('[Orders] Order email dispatch failed:', err));

    return res.status(201).json({ message: 'Order simulation processed, notification email queued.' });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
});

// Admin / Dashboard inquiries
router.get('/inquiries', getInquiries);

export default router;
