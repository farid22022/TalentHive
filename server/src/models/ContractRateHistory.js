import mongoose from 'mongoose';
const { Schema } = mongoose;
const schema = new Schema({ contract: { type: Schema.Types.ObjectId, ref: 'Contract', required: true, index: true }, previousRate: Number, newRate: { type: Number, required: true }, currency: String, effectiveFrom: { type: Date, required: true }, effectiveTo: Date, changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }, reason: String, status: { type: String, enum: ['active', 'superseded'], default: 'active' } }, { timestamps: true });
export const ContractRateHistory = mongoose.model('ContractRateHistory', schema);
