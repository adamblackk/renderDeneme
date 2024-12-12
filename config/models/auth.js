const mongoose = require('mongoose');

// Kullanıcı Şeması
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  age: { type: Number, required: true }
});

// Kullanıcı Modeli
const User = mongoose.model('userInfo', userSchema,'userInfo');

module.exports = {User};
