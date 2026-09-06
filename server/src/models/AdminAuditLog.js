import mongoose from 'mongoose';
const { Schema } = mongoose;
const schema = new Schema({ admin: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, action: { type: String, required: true, index: true }, entityType: { type: String, required: true }, entityId: { type: Schema.Types.ObjectId, index: true }, reason: { type: String, required: true, maxlength: 2000 }, before: Schema.Types.Mixed, after: Schema.Types.Mixed, requestId: String, ip: String }, { timestamps: true });
schema.index({ createdAt: -1 });
export const AdminAuditLog = mongoose.model('AdminAuditLog', schema);
