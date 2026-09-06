import mongoose from 'mongoose';
import { HOURLY_INVOICE_STATUS } from '../config/constants.js';
const { Schema } = mongoose;
const line = new Schema({ date: Date, description: String, minutes: Number, hours: Number, rate: Number, amount: Number }, { _id: false });
const schema = new Schema({ invoiceNumber: { type: String, unique: true, index: true }, contract: { type: Schema.Types.ObjectId, ref: 'Contract', required: true, index: true }, billingPeriod: { type: Schema.Types.ObjectId, ref: 'BillingPeriod', required: true, unique: true }, client: { type: Schema.Types.ObjectId, ref: 'User', required: true }, freelancer: { type: Schema.Types.ObjectId, ref: 'User', required: true }, lineItems: [line], subtotal: { type: Number, required: true }, platformFee: { type: Number, required: true }, freelancerAmount: { type: Number, required: true }, currency: { type: String, uppercase: true, default: 'USD' }, status: { type: String, enum: Object.values(HOURLY_INVOICE_STATUS), default: HOURLY_INVOICE_STATUS.GENERATED, index: true }, payment: { type: Schema.Types.ObjectId, ref: 'Payment' }, issuedAt: { type: Date, default: Date.now }, dueAt: Date, paidAt: Date }, { timestamps: true });
schema.index({ contract: 1, createdAt: -1 });
export const HourlyInvoice = mongoose.model('HourlyInvoice', schema);
