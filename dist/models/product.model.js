"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Product = void 0;
const mongoose_1 = require("mongoose");
const localizedDetailsSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    tags: [{ type: String }]
}, { _id: false });
const productSchema = new mongoose_1.Schema({
    sku: { type: String, required: true, unique: true },
    price: { type: Number, required: true },
    category: {
        type: String,
        required: true
    },
    materials: [{ type: String }],
    sizes: [{ type: String }],
    images: [{ type: String }],
    stock: { type: Number, required: true, default: 0 },
    featured: { type: Boolean, default: false },
    it: { type: localizedDetailsSchema, required: true },
    en: { type: localizedDetailsSchema, required: true }
}, {
    timestamps: true
});
exports.Product = (0, mongoose_1.model)('Product', productSchema);
exports.default = exports.Product;
