import { Schema, model } from 'mongoose';

export interface IInquiry {
  type: 'newsletter' | 'contact';
  email: string;
  name?: string;
  subject?: string;
  message?: string;
}

const inquirySchema = new Schema<IInquiry>({
  type: { type: String, required: true, enum: ['newsletter', 'contact'] },
  email: { type: String, required: true },
  name: { type: String },
  subject: { type: String },
  message: { type: String }
}, {
  timestamps: true
});

export const Inquiry = model<IInquiry>('Inquiry', inquirySchema);
export default Inquiry;
