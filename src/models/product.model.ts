import { Schema, model } from 'mongoose';

export interface ILocalizedDetails {
  name: string;
  description: string;
  tags: string[];
}

export interface IProduct {
  sku: string;
  price: number;
  category: 'kurtis' | 'dailywear' | 'modern' | 'jewelry';
  materials: string[];
  sizes: string[];
  images: string[];
  stock: number;
  featured: boolean;
  it: ILocalizedDetails;
  en: ILocalizedDetails;
}

const localizedDetailsSchema = new Schema<ILocalizedDetails>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  tags: [{ type: String }]
}, { _id: false });

const productSchema = new Schema<IProduct>({
  sku: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
  category: { 
    type: String, 
    required: true, 
    enum: ['kurtis', 'dailywear', 'modern', 'jewelry'] 
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

export const Product = model<IProduct>('Product', productSchema);
export default Product;
