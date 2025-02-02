const mongoose = require('mongoose');

// Hikaye Şeması
/* const storySchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true }, // Benzersiz başlık
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
}); */

const storySchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true, 
    unique: true 
  },
  content: { 
    type: String, 
    required: true 
  },
  imageUrl: { 
    type: String, 
    required: true 
  },
  category: { 
    type: String, 
    required: true 
  },
  discipline: { 
    type: String, 
    required: true 
  },
  mainCharacter: { 
    type: String, 
    required: true 
  },
  readingTime: { 
    type: String, 
    required: true 
  },
  tags: { 
    type: [String], 
    default: [] 
  },
  stats: {
    views: { 
      type: Number, 
      default: 0 
    },
    likes: { 
      type: Number, 
      default: 0 
    },
    saves: { 
      type: Number, 
      default: 0 
    },
    shares: { 
      type: Number, 
      default: 0 
    }
  },
  isPremium: { 
    type: Boolean, 
    default: false 
  }
}, {
  timestamps: true // createdAt ve updatedAt otomatik oluşturulur
});

// İndexler ekleyelim (performans için)
storySchema.index({ category: 1 });
storySchema.index({ discipline: 1 });
storySchema.index({ mainCharacter: 1 });
storySchema.index({ tags: 1 });
storySchema.index({ isPremium: 1 });


// Hikaye Modeli
const Story = mongoose.model('Story', storySchema);

module.exports = { Story };
