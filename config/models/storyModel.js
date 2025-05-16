const mongoose = require('mongoose');


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
  description: { 
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
  },
  audioVariants: [
    {
      speaker: { type: String, required: true },
      url: { type: String, required: true }
    }
  ]
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
const Story_tr = mongoose.model("stories_tr",storySchema)
const Story_en = mongoose.model("stories_en",storySchema)
const Story_es = mongoose.model("stories_es",storySchema)

module.exports = { 
  Story_tr,
  Story_en,
  Story_es

 };
