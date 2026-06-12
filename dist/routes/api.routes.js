"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const product_controller_1 = require("../controllers/product.controller");
const inquiry_controller_1 = require("../controllers/inquiry.controller");
const email_service_1 = require("../services/email.service");
const router = (0, express_1.Router)();
const cloudinary_1 = require("cloudinary");
// Configure Cloudinary
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
// Configure Multer Storage in Memory
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit 5MB
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path_1.default.extname(file.originalname).toLowerCase());
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
            const uploadDir = path_1.default.join(process.cwd(), 'public/uploads');
            if (!fs_1.default.existsSync(uploadDir)) {
                fs_1.default.mkdirSync(uploadDir, { recursive: true });
            }
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = path_1.default.extname(req.file.originalname);
            const filename = 'img-' + uniqueSuffix + ext;
            const filepath = path_1.default.join(uploadDir, filename);
            // Save buffer to file
            fs_1.default.writeFileSync(filepath, req.file.buffer);
            const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
            const fileUrl = `${backendUrl}/uploads/${filename}`;
            return res.status(201).json({ url: fileUrl });
        }
        // Stream buffer directly to Cloudinary
        console.log('[Upload] Streaming file buffer to Cloudinary...');
        const uploadStream = cloudinary_1.v2.uploader.upload_stream({ folder: 'sita_seta_uploads' }, (error, result) => {
            if (error) {
                console.error('[Cloudinary] Stream upload failed:', error);
                return res.status(500).json({ message: 'Cloudinary upload failed: ' + error.message });
            }
            if (!result) {
                return res.status(500).json({ message: 'Cloudinary upload failed: empty response' });
            }
            console.log('[Cloudinary] Secure URL generated:', result.secure_url);
            return res.status(201).json({ url: result.secure_url });
        });
        uploadStream.end(req.file.buffer);
    }
    catch (error) {
        console.error('[Upload] Route error:', error);
        return res.status(500).json({ message: error.message });
    }
});
// Product catalog routes
router.get('/products', product_controller_1.getProducts);
router.get('/products/:id', product_controller_1.getProductById);
router.post('/products', product_controller_1.createProduct);
router.put('/products/:id', product_controller_1.updateProduct);
router.delete('/products/:id', product_controller_1.deleteProduct);
// Customer actions
router.post('/contact', inquiry_controller_1.createInquiry);
router.post('/newsletter', inquiry_controller_1.subscribeNewsletter);
// Simulated Order Submission Route
router.post('/orders', async (req, res) => {
    try {
        const { email, items, total } = req.body;
        if (!email || !items || !total) {
            return res.status(400).json({ message: 'Email, items, and total are required' });
        }
        // Dispatch order summary email asynchronously in background
        (0, email_service_1.sendOrderEmail)(email, items, total)
            .then(success => console.log(`[Orders] Order notification email dispatched: ${success}`))
            .catch(err => console.error('[Orders] Order email dispatch failed:', err));
        return res.status(201).json({ message: 'Order simulation processed, notification email queued.' });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
// Admin / Dashboard inquiries
router.get('/inquiries', inquiry_controller_1.getInquiries);
// Admin login route
router.post('/admin/login', (req, res) => {
    const { email, password } = req.body;
    const adminEmail = process.env.ADMIN_EMAIL || 'aayush6b12@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'soniKmno4@';
    if (email === adminEmail && password === adminPassword) {
        return res.json({ success: true, message: 'Login successful' });
    }
    else {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});
exports.default = router;
