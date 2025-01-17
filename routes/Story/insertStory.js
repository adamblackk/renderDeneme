const express = require('express');
const router = express.Router();
const authenticateToken = require('../../config/utils/authenticateToken'); // Middleware'i içe aktarın
const StoryFromModel = require('../../config/models/storyModel');


router.post('/insertStories', authenticateToken, async (req, res) => {
    try {
      const stories = req.body;
  
      if (!stories || !Array.isArray(stories) || stories.length === 0) {
        return res.status(400).json({ error: 'Geçerli bir hikaye listesi gönderilmedi!' });
      }
  
      // Benzersiz kontrolü
      const duplicateTitles = [];
      for (const story of stories) {
        const existingStory = await StoryFromModel.Story.findOne({ title: story.title });
        if (existingStory) {
          duplicateTitles.push(story.title);
        }
      }
  
      if (duplicateTitles.length > 0) {
        return res.status(400).json({
          error: 'Bazı hikayeler zaten mevcut!',
          duplicates: duplicateTitles,
        });
      }
  
      // Yeni hikayeleri ekle
      const formattedStories = stories.map((story) => ({
        title: story.title,
        summary: story.summary,
        content: story.content,
        category: story.category,
        tags: story.tags || [],
        imageUrl: story.imageUrl || null,
        source: story.source || null,
        isPremium: story.isPremium || false,
      }));
  
      const result = await StoryFromModel.Story.insertMany(formattedStories);
  
      res.status(201).json({
        message: 'Hikayeler başarıyla eklendi!',
        count: result.length,
        insertedIds: result.map((story) => story._id),
      });
    } catch (error) {
      console.error('Hata:', error.message);
      res.status(500).json({ error: 'Hikayeler eklenirken bir hata oluştu.' });
    }
  });
  


module.exports = router;
