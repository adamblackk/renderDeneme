const express = require('express');
const router = express.Router();
const authenticateToken = require('../../config/utils/authenticateToken'); // Middleware'i içe aktarın
const StoryFromModel = require('../../config/models/storyModel');

router.get('/getAllStory', authenticateToken, async (req, res) => {
    try {
      const AllStory = await StoryFromModel.Story.find().select('-_id -__v');
      res.status(200).json(AllStory);
    } catch (error) {
      console.error('Hata:', error.message);
      res.status(500).json({ error: 'Ücretsiz hikayeler alınırken bir hata oluştu.' });
    }
  });
  
  

module.exports = router;