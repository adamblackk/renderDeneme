const mongoose = require('mongoose');

const storyCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // Kategori adı
  imageUrl: { type: String, required: true }, // Kategorinin görsel URL'si
  isPremium: { type: Boolean, default: false } // Kategori premium mu?
}, {
  timestamps: true // createdAt ve updatedAt otomatik olarak eklenir
});

const StoryCategory = mongoose.model('Category', storyCategorySchema);

module.exports = { StoryCategory };
