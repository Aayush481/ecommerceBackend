"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProductById = exports.getProducts = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const product_model_1 = __importDefault(require("../models/product.model"));
const FALLBACK_DB_PATH = path_1.default.join(__dirname, '..', 'fallback_db.json');
// Helper to read fallback JSON db
const readFallbackDb = () => {
    try {
        if (fs_1.default.existsSync(FALLBACK_DB_PATH)) {
            const raw = fs_1.default.readFileSync(FALLBACK_DB_PATH, 'utf-8');
            return JSON.parse(raw);
        }
    }
    catch (err) {
        console.error('Error reading fallback db file:', err);
    }
    return [];
};
// Helper to write fallback JSON db
const writeFallbackDb = (data) => {
    try {
        fs_1.default.writeFileSync(FALLBACK_DB_PATH, JSON.stringify(data, null, 2));
    }
    catch (err) {
        console.error('Error writing fallback db file:', err);
    }
};
const isMongoConnected = () => mongoose_1.default.connection.readyState === 1;
const getProducts = async (req, res) => {
    try {
        const { category, minPrice, maxPrice, search, material, sort } = req.query;
        if (isMongoConnected()) {
            const query = {};
            if (category)
                query.category = category;
            if (material)
                query.materials = material;
            if (minPrice || maxPrice) {
                query.price = {};
                if (minPrice)
                    query.price.$gte = Number(minPrice);
                if (maxPrice)
                    query.price.$lte = Number(maxPrice);
            }
            if (search) {
                const searchRegex = new RegExp(String(search), 'i');
                query.$or = [
                    { sku: searchRegex },
                    { 'it.name': searchRegex },
                    { 'it.description': searchRegex },
                    { 'it.tags': searchRegex },
                    { 'en.name': searchRegex },
                    { 'en.description': searchRegex },
                    { 'en.tags': searchRegex }
                ];
            }
            let dbQuery = product_model_1.default.find(query);
            if (sort) {
                if (sort === 'price_asc')
                    dbQuery = dbQuery.sort({ price: 1 });
                else if (sort === 'price_desc')
                    dbQuery = dbQuery.sort({ price: -1 });
                else if (sort === 'newest')
                    dbQuery = dbQuery.sort({ createdAt: -1 });
            }
            const products = await dbQuery.exec();
            return res.json(products);
        }
        else {
            // Fallback local memory file implementation
            let products = readFallbackDb();
            if (category) {
                products = products.filter(p => p.category === category);
            }
            if (material) {
                products = products.filter(p => p.materials?.includes(String(material)));
            }
            if (minPrice) {
                products = products.filter(p => p.price >= Number(minPrice));
            }
            if (maxPrice) {
                products = products.filter(p => p.price <= Number(maxPrice));
            }
            if (search) {
                const searchLower = String(search).toLowerCase();
                products = products.filter(p => p.sku.toLowerCase().includes(searchLower) ||
                    p.it.name.toLowerCase().includes(searchLower) ||
                    p.it.description.toLowerCase().includes(searchLower) ||
                    p.it.tags.some(t => t.toLowerCase().includes(searchLower)) ||
                    p.en.name.toLowerCase().includes(searchLower) ||
                    p.en.description.toLowerCase().includes(searchLower) ||
                    p.en.tags.some(t => t.toLowerCase().includes(searchLower)));
            }
            if (sort) {
                if (sort === 'price_asc')
                    products.sort((a, b) => a.price - b.price);
                else if (sort === 'price_desc')
                    products.sort((a, b) => b.price - a.price);
            }
            return res.json(products);
        }
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.getProducts = getProducts;
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        if (isMongoConnected()) {
            // If it looks like a Mongoose ObjectId, query by _id, otherwise by SKU
            const product = mongoose_1.default.Types.ObjectId.isValid(id)
                ? await product_model_1.default.findById(id)
                : await product_model_1.default.findOne({ sku: id });
            if (!product)
                return res.status(404).json({ message: 'Product not found' });
            return res.json(product);
        }
        else {
            const products = readFallbackDb();
            const product = products.find(p => p.sku === id || p._id === id);
            if (!product)
                return res.status(404).json({ message: 'Product not found' });
            return res.json(product);
        }
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.getProductById = getProductById;
const createProduct = async (req, res) => {
    try {
        const productData = req.body;
        if (!productData.sku || !productData.price || !productData.category) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        if (isMongoConnected()) {
            const newProduct = new product_model_1.default(productData);
            await newProduct.save();
            return res.status(201).json(newProduct);
        }
        else {
            const products = readFallbackDb();
            if (products.some(p => p.sku === productData.sku)) {
                return res.status(400).json({ message: 'Product with this SKU already exists' });
            }
            const newProduct = {
                _id: new mongoose_1.default.Types.ObjectId().toString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                ...productData
            };
            products.push(newProduct);
            writeFallbackDb(products);
            return res.status(201).json(newProduct);
        }
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.createProduct = createProduct;
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        if (isMongoConnected()) {
            const query = mongoose_1.default.Types.ObjectId.isValid(id) ? { _id: id } : { sku: id };
            const updatedProduct = await product_model_1.default.findOneAndUpdate(query, updateData, { new: true });
            if (!updatedProduct)
                return res.status(404).json({ message: 'Product not found' });
            return res.json(updatedProduct);
        }
        else {
            const products = readFallbackDb();
            const idx = products.findIndex(p => p.sku === id || p._id === id);
            if (idx === -1)
                return res.status(404).json({ message: 'Product not found' });
            products[idx] = {
                ...products[idx],
                ...updateData,
                updatedAt: new Date().toISOString()
            };
            writeFallbackDb(products);
            return res.json(products[idx]);
        }
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        if (isMongoConnected()) {
            const query = mongoose_1.default.Types.ObjectId.isValid(id) ? { _id: id } : { sku: id };
            const deletedProduct = await product_model_1.default.findOneAndDelete(query);
            if (!deletedProduct)
                return res.status(404).json({ message: 'Product not found' });
            return res.json({ message: 'Product deleted successfully' });
        }
        else {
            const products = readFallbackDb();
            const initialLen = products.length;
            const filtered = products.filter(p => p.sku !== id && p._id !== id);
            if (filtered.length === initialLen) {
                return res.status(404).json({ message: 'Product not found' });
            }
            writeFallbackDb(filtered);
            return res.json({ message: 'Product deleted successfully' });
        }
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.deleteProduct = deleteProduct;
