import mongoose from 'mongoose';
const schema = new mongoose.Schema({ code: { type: String, uppercase: true, unique: true }, name: String, symbol: String, decimalDigits: { type: Number, default: 2 }, enabled: { type: Boolean, default: true }, supportedForPayments: { type: Boolean, default: false } });
export const Currency = mongoose.model('Currency', schema);
