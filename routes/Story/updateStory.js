const express = require('express');
const router = express.Router();
const authenticateToken = require('../../config/utils/authenticateToken');
const StoryFromModel = require('../../config/models/storyModel');

// PATCH: Her istekte alan artırma endpoint'i
router.patch('/incrementStoryField', authenticateToken, async (req, res) => {
  try {
    const { storyId, field } = req.body;

    // Gerekli alanların kontrolü
    if (!storyId || !field) {
      return res.status(400).json({ error: 'Gerekli alanlar eksik!' });
    }

    // Desteklenen alanlar
    const validFields = ['views', 'likes', 'saves', 'shares'];
    if (!validFields.includes(field)) {
      return res.status(400).json({ error: `Geçersiz alan: ${field}` });
    }

    // stats objesi içindeki alanı 1 artır
    const updatedStory = await StoryFromModel.Story.findByIdAndUpdate(
      storyId,
      { $inc: { [`stats.${field}`]: 1 } }, // stats objesi içindeki alanı artır
      { 
        new: true,
        select: 'title stats' // Sadece gerekli alanları döndür
      }
    );

    if (!updatedStory) {
      return res.status(404).json({ error: 'Hikaye bulunamadı!' });
    }

    res.status(200).json({
      success : true
    });
  } catch (error) {
    console.error('Hata:', error.message);
    res.status(500).json({ 
      success : false,
      error : error.message
    });
  }
});

module.exports = router;
