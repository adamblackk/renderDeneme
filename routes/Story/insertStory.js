const express = require('express');
const router = express.Router();
const authenticateToken = require('../../config/utils/authenticateToken'); // Middleware'i içe aktarın
const StoryFromModel = require('../../config/models/storyModel');


router.post('/insertStories', authenticateToken, async (req, res) => {
  try {
      // Gelen veriyi array'e çevir (tek veya çoklu)
      const stories = Array.isArray(req.body) ? req.body : [req.body];

      // Boş kontrol
      if (stories.length === 0) {
          return res.status(400).json({ 
              error: 'Hikaye verisi gönderilmedi!' 
          });
      }

      // Benzersiz başlık kontrolü
      const existingTitles = await StoryFromModel.Story.find({
          title: { $in: stories.map(story => story.title) }
      }).select('title');

      if (existingTitles.length > 0) {
          return res.status(400).json({
              error: 'Bazı hikayeler zaten mevcut!',
              duplicates: existingTitles.map(story => story.title)
          });
      }

      // Hikayeleri hazırla
      const storiesToInsert = stories.map(story => ({
          title: story.title,
          content: story.content,
          imageUrl: story.imageUrl,
          category: story.category,
          discipline: story.discipline,
          mainCharacter: story.mainCharacter,
          readingTime: Math.ceil(story.content.split(/\s+/).length / 200).toString(),
          tags: story.tags || [],
          stats: {
              views: 0,
              likes: 0,
              saves: 0,
              shares: 0
          },
          isPremium: story.isPremium || false
      }));

      // Ekleme yap
      const result = await StoryFromModel.Story.insertMany(storiesToInsert);

      res.status(201).json({
          message: `${result.length} hikaye başarıyla eklendi!`,
          count: result.length,
          insertedIds: result.map(story => story._id)
      });

  } catch (error) {
      console.error('Hata:', error.message);
      res.status(500).json({ 
          error: 'Hikaye eklenirken bir hata oluştu.',
          details: error.message 
      });
  }
});

  


module.exports = router;
