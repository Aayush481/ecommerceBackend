"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInquiries = exports.subscribeNewsletter = exports.createInquiry = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const inquiry_model_1 = __importDefault(require("../models/inquiry.model"));
const email_service_1 = require("../services/email.service");
const FALLBACK_INQUIRY_PATH = path_1.default.join(__dirname, '..', 'inquiries_fallback.json');
const readFallbackInquiries = () => {
    try {
        if (fs_1.default.existsSync(FALLBACK_INQUIRY_PATH)) {
            const raw = fs_1.default.readFileSync(FALLBACK_INQUIRY_PATH, 'utf-8');
            return JSON.parse(raw);
        }
    }
    catch (err) {
        console.error('Error reading fallback inquiries:', err);
    }
    return [];
};
const writeFallbackInquiries = (data) => {
    try {
        fs_1.default.writeFileSync(FALLBACK_INQUIRY_PATH, JSON.stringify(data, null, 2));
    }
    catch (err) {
        console.error('Error writing fallback inquiries:', err);
    }
};
const isMongoConnected = () => mongoose_1.default.connection.readyState === 1;
const createInquiry = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        if (!email || !message) {
            return res.status(400).json({ message: 'Email and message are required' });
        }
        const data = {
            type: 'contact',
            email,
            name,
            subject: subject || 'Contact Request',
            message
        };
        // Dispatch email asynchronously in background
        (0, email_service_1.sendQueryEmail)(name || 'Customer', email, subject || 'Contact Request', message)
            .then(success => console.log(`[Inquiry] Email query sent: ${success}`))
            .catch(err => console.error('[Inquiry] Email query failed:', err));
        if (isMongoConnected()) {
            const newInquiry = new inquiry_model_1.default(data);
            await newInquiry.save();
            return res.status(201).json(newInquiry);
        }
        else {
            const inquiries = readFallbackInquiries();
            const newInquiry = {
                _id: new mongoose_1.default.Types.ObjectId().toString(),
                createdAt: new Date().toISOString(),
                ...data
            };
            inquiries.push(newInquiry);
            writeFallbackInquiries(inquiries);
            return res.status(201).json(newInquiry);
        }
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.createInquiry = createInquiry;
const subscribeNewsletter = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }
        const data = {
            type: 'newsletter',
            email
        };
        if (isMongoConnected()) {
            const newInquiry = new inquiry_model_1.default(data);
            await newInquiry.save();
            return res.status(201).json(newInquiry);
        }
        else {
            const inquiries = readFallbackInquiries();
            // Check if already subscribed
            const alreadySubbed = inquiries.some(i => i.type === 'newsletter' && i.email.toLowerCase() === email.toLowerCase());
            if (alreadySubbed) {
                return res.status(200).json({ message: 'Already subscribed' });
            }
            const newInquiry = {
                _id: new mongoose_1.default.Types.ObjectId().toString(),
                createdAt: new Date().toISOString(),
                ...data
            };
            inquiries.push(newInquiry);
            writeFallbackInquiries(inquiries);
            return res.status(201).json(newInquiry);
        }
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.subscribeNewsletter = subscribeNewsletter;
const getInquiries = async (req, res) => {
    try {
        if (isMongoConnected()) {
            const inquiries = await inquiry_model_1.default.find().sort({ createdAt: -1 });
            return res.json(inquiries);
        }
        else {
            const inquiries = readFallbackInquiries();
            // Sort newest first
            inquiries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            return res.json(inquiries);
        }
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.getInquiries = getInquiries;
