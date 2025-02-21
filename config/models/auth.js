const mongoose = require('mongoose');

// Kullanıcı Şeması
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String },
  isActive: { type: Boolean, default: true },
  isPremium: { type: Boolean, default: false },
  premiumStart: { type: Date, default: null },
  premiumEnd: { type: Date, default: null },
  purchaseToken: { type: String, default: null },
  subscriptionId: { type: String, default: null },
  orderId: { type: String, default: null }, // Eklendi
  autoRenewing: { type: Boolean, default: false },
  lastVerified: { type: Date, default: null }
}, {
  timestamps: true
});

// Performans için index ekleyelim
userSchema.index({ purchaseToken: 1 });
userSchema.index({ orderId: 1 });

const User = mongoose.model('userInfo', userSchema, 'userInfo');

module.exports = { User };
