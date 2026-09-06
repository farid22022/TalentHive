import mongoose from 'mongoose';
const { Schema } = mongoose;
const schema = new Schema({ user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true }, averageRating: { type: Number, default: 0 }, rawAverage: { type: Number, default: 0 }, reviewCount: { type: Number, default: 0 }, distribution: { type: Map, of: Number, default: {} }, completedContracts: { type: Number, default: 0 }, wouldHireAgain: { type: Number, default: 0 }, successScore: { type: Number, default: 0 }, badges: { type: [String], default: [] } }, { timestamps: true });
export const Reputation = mongoose.model('Reputation', schema);
