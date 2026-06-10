import { Request, Response } from 'express';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import Product, { IProduct } from '../models/product.model';

const FALLBACK_DB_PATH = path.join(__dirname, '..', 'fallback_db.json');

// Helper to read fallback JSON db
const readFallbackDb = (): IProduct[] => {
  try {
    if (fs.existsSync(FALLBACK_DB_PATH)) {
      const raw = fs.readFileSync(FALLBACK_DB_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading fallback db file:', err);
  }
  return [];
};

// Helper to write fallback JSON db
const writeFallbackDb = (data: any[]) => {
  try {
    fs.writeFileSync(FALLBACK_DB_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing fallback db file:', err);
  }
};

const isMongoConnected = () => mongoose.connection.readyState === 1;

export const getProducts = async (req: Request, res: Response) => {
  try {
    const { category, minPrice, maxPrice, search, material, sort } = req.query;

    if (isMongoConnected()) {
      const query: any = {};

      if (category) query.category = category;
      if (material) query.materials = material;
      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = Number(minPrice);
        if (maxPrice) query.price.$lte = Number(maxPrice);
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

      let dbQuery = Product.find(query);

      if (sort) {
        if (sort === 'price_asc') dbQuery = dbQuery.sort({ price: 1 });
        else if (sort === 'price_desc') dbQuery = dbQuery.sort({ price: -1 });
        else if (sort === 'newest') dbQuery = dbQuery.sort({ createdAt: -1 });
      }

      const products = await dbQuery.exec();
      return res.json(products);
    } else {
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
        products = products.filter(p => 
          p.sku.toLowerCase().includes(searchLower) ||
          p.it.name.toLowerCase().includes(searchLower) ||
          p.it.description.toLowerCase().includes(searchLower) ||
          p.it.tags.some(t => t.toLowerCase().includes(searchLower)) ||
          p.en.name.toLowerCase().includes(searchLower) ||
          p.en.description.toLowerCase().includes(searchLower) ||
          p.en.tags.some(t => t.toLowerCase().includes(searchLower))
        );
      }

      if (sort) {
        if (sort === 'price_asc') products.sort((a, b) => a.price - b.price);
        else if (sort === 'price_desc') products.sort((a, b) => b.price - a.price);
      }

      return res.json(products);
    }
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (isMongoConnected()) {
      // If it looks like a Mongoose ObjectId, query by _id, otherwise by SKU
      const product = mongoose.Types.ObjectId.isValid(id)
        ? await Product.findById(id)
        : await Product.findOne({ sku: id });

      if (!product) return res.status(404).json({ message: 'Product not found' });
      return res.json(product);
    } else {
      const products = readFallbackDb();
      const product = products.find(p => p.sku === id || (p as any)._id === id);
      if (!product) return res.status(404).json({ message: 'Product not found' });
      return res.json(product);
    }
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const productData = req.body;
    if (!productData.sku || !productData.price || !productData.category) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (isMongoConnected()) {
      const newProduct = new Product(productData);
      await newProduct.save();
      return res.status(201).json(newProduct);
    } else {
      const products = readFallbackDb();
      if (products.some(p => p.sku === productData.sku)) {
        return res.status(400).json({ message: 'Product with this SKU already exists' });
      }
      
      const newProduct = {
        _id: new mongoose.Types.ObjectId().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...productData
      };
      
      products.push(newProduct);
      writeFallbackDb(products);
      return res.status(201).json(newProduct);
    }
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (isMongoConnected()) {
      const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { sku: id };
      const updatedProduct = await Product.findOneAndUpdate(query, updateData, { new: true });
      if (!updatedProduct) return res.status(404).json({ message: 'Product not found' });
      return res.json(updatedProduct);
    } else {
      const products = readFallbackDb();
      const idx = products.findIndex(p => p.sku === id || (p as any)._id === id);
      if (idx === -1) return res.status(404).json({ message: 'Product not found' });

      products[idx] = {
        ...products[idx],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      writeFallbackDb(products);
      return res.json(products[idx]);
    }
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (isMongoConnected()) {
      const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { sku: id };
      const deletedProduct = await Product.findOneAndDelete(query);
      if (!deletedProduct) return res.status(404).json({ message: 'Product not found' });
      return res.json({ message: 'Product deleted successfully' });
    } else {
      const products = readFallbackDb();
      const initialLen = products.length;
      const filtered = products.filter(p => p.sku !== id && (p as any)._id !== id);
      
      if (filtered.length === initialLen) {
        return res.status(404).json({ message: 'Product not found' });
      }

      writeFallbackDb(filtered);
      return res.json({ message: 'Product deleted successfully' });
    }
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};
