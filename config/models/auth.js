const mongoose = require('mongoose');

// Kullanıcı Şeması
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true }, // E-posta benzersiz ve zorunlu
  password: { type: String }, // Şifre (opsiyonel)
  isActive: { type: Boolean, default: true }, // Kullanıcı aktif mi?
  isPremium: { type: Boolean, default: false }, // Premium abonelik durumu
  premiumStart: { type: Date, default: null }, // Premium başlangıç tarihi
  premiumEnd: { type: Date, default: null }, // Premium bitiş tarihi
  purchaseToken: { type: String, default: null }, // Play Store'dan gelen satın alma jetonu
  subscriptionId: { type: String, default: null }, // Abonelik türü (ör: monthly_subscription)
  autoRenewing: { type: Boolean, default: false }, // Aboneliğin otomatik yenilenip yenilenmediği
  lastVerified: { type: Date, default: null } // Abonelik durumunun en son doğrulandığı tarih
}, {
  timestamps: true // createdAt ve updatedAt otomatik olarak eklenir
});

// Kullanıcı Modeli
const User = mongoose.model('userInfo', userSchema, 'userInfo');

module.exports = { User };
