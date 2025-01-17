const express = require('express');
const router = express.Router();
const authenticateToken = require('../../config/utils/authenticateToken'); // Middleware'i içe aktarın
const StoryFromModel = require('../../config/models/storyModel');

router.get('/getFreeStories', authenticateToken, async (req, res) => {
    try {
      const freeStories = await StoryFromModel.Story.find({ isPremium: false }).select('-_id -__v');
      res.status(200).json(freeStories);
    } catch (error) {
      console.error('Hata:', error.message);
      res.status(500).json({ error: 'Ücretsiz hikayeler alınırken bir hata oluştu.' });
    }
  });
  
  

module.exports = router;