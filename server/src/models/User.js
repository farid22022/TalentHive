import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config/index.js';
import { ROLES, USER_STATUS } from '../config/constants.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    // Primary/active role + full set of capabilities the account holds.
    role: { type: String, enum: Object.values(ROLES), default: ROLES.FREELANCER },
    roles: { type: [String], enum: Object.values(ROLES), default: [] },
    avatar: { type: String, default: '' },
    phone: { type: String, default: '' },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    status: { type: String, enum: Object.values(USER_STATUS), default: USER_STATUS.ACTIVE },
    lastActiveAt: { type: Date, default: Date.now },
    language: { type: String, default: 'en', trim: true, maxlength: 10 },
    locale: { type: String, default: 'en-US', trim: true, maxlength: 20 },
    timezone: { type: String, default: 'UTC', maxlength: 80 },
    currency: { type: String, default: 'USD', uppercase: true, maxlength: 3 },
    region: { type: String, default: 'US', uppercase: true, maxlength: 2 },
  },
  { timestamps: true }
);

// Never leak sensitive fields.
userSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

userSchema.methods.setPassword = async function setPassword(plain) {
  this.passwordHash = await bcrypt.hash(plain, config.bcryptCost);
};

userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.passwordHash || '');
};

userSchema.methods.hasRole = function hasRole(role) {
  return this.role === role || (this.roles || []).includes(role);
};

export const User = mongoose.model('User', userSchema);
