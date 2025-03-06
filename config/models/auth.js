const mongoose = require('mongoose');

// Mevcut yapıyı koruyarak ek alanlar ekleyelim
const userSchema = new mongoose.Schema({
  // Mevcut alanlar (değişmeden)
  email: { type: String, required: true, unique: true },
  password: { type: String },
  isActive: { type: Boolean, default: true },
  isPremium: { type: Boolean, default: false },
  premiumStart: { type: Date, default: null },
  premiumEnd: { type: Date, default: null },
  purchaseToken: { type: String, default: null },
  subscriptionId: { type: String, default: null },
  orderId: { type: String, default: null },
  autoRenewing: { type: Boolean, default: false },
  lastVerified: { type: Date, default: null },

  // Yeni eklenen alanlar
  subscriptionDetails: {
    type: {
      status: String,  // 'ACTIVE', 'GRACE_PERIOD', 'CANCELLED', 'EXPIRED'
      cancelReason: Number,
      paymentStatus: String,
      gracePeriodEnd: Date
    },
    default: null
  },
  
  // İsteğe bağlı geçmiş kaydı
  subscriptionHistory: [{
    action: String,
    date: Date,
    details: mongoose.Schema.Types.Mixed
  }],
  // FCM Token alanı
  fcmToken: { type: String, default: null },
  language: {
    type: String,
    enum: ['tr', 'en', 'es'], // sadece desteklenen diller
    default: 'en', // varsayılan İngilizce
    required: true
},
timezone: { 
  type: String, 
  default: 'America/New_York' 
}
}, {
  timestamps: true
});

// Performans için index ekleyelim
userSchema.index({ purchaseToken: 1 });
userSchema.index({ orderId: 1 });

const User = mongoose.model('userInfo', userSchema, 'userInfo');

module.exports = { User };
