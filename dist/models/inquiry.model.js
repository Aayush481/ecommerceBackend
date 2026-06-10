"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Inquiry = void 0;
const mongoose_1 = require("mongoose");
const inquirySchema = new mongoose_1.Schema({
    type: { type: String, required: true, enum: ['newsletter', 'contact'] },
    email: { type: String, required: true },
    name: { type: String },
    subject: { type: String },
    message: { type: String }
}, {
    timestamps: true
});
exports.Inquiry = (0, mongoose_1.model)('Inquiry', inquirySchema);
exports.default = exports.Inquiry;
