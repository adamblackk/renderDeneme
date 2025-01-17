const mongoose = require('mongoose');

// Hikaye Şeması
const storySchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true }, // Benzersiz başlık
  summary: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, required: true },
  tags: { type: [String], default: [] },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  saves: { type: Number, default: 0 },
  imageUrl: { type: String, default: null },
  source: { type: String, default: null },
  isPremium: { type: Boolean, default: false },
}, {
  timestamps: true
});


// Hikaye Modeli
const Story = mongoose.model('Story', storySchema);

module.exports = { Story };
