const mongoose = require('mongoose');

// Kullanıcı Şeması
const userSchema = new mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
  isActive: { type: Boolean, required: true }
}, {
  timestamps: true // createdAt ve updatedAt alanlarını otomatik ekler
});

// Kullanıcı Modeli
const User = mongoose.model('userInfo', userSchema, 'userInfo');

module.exports = { User };
