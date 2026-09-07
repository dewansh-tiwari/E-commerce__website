import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const addressSchema = new mongoose.Schema({
  title: { type: String, default: 'Home' }, // Home, Work, Other
  name: { type: String, required: true },
  phone: { type: String, required: true },
  street: { type: String, required: true },
  apartment: { type: String, default: '' },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  isDefault: { type: Boolean, default: false }
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  phone: { type: String, default: '' },
  role: { type: String, enum: ['customer', 'shopkeeper', 'admin'], default: 'customer' },
  status: { type: String, enum: ['active', 'blocked'], default: 'active' },
  shopDetails: {
    storeName: { type: String, default: '' },
    gstNumber: { type: String, default: '' },
    businessType: { type: String, default: 'Kirana & Retail Store' }
  },
  addresses: [addressSchema],
  coins: { type: Number, default: 250 }, // Starting gamification rewards
  lastDailyClaim: { type: Date, default: null },
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);
