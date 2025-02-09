const mongoose = require('mongoose');

const storyCategorySchema = new mongoose.Schema({
  category: { type: String, required: true, unique: true }, // Kategori adı
  imageUrl: { type: String, required: true }, // Kategorinin görsel URL'si
  isPremium: { type: Boolean, default: false } // Kategori premium mu?
}, {
  timestamps: true // createdAt ve updatedAt otomatik olarak eklenir
});

const StoryCategory_tr = mongoose.model('Category_tr', storyCategorySchema);
const StoryCategory_en = mongoose.model('Category_en', storyCategorySchema);
const StoryCategory_es = mongoose.model('Category_es', storyCategorySchema);

module.exports = {
  StoryCategory_tr,
  StoryCategory_en,
  StoryCategory_es,
};
