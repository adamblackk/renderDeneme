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
    const validFields = ['likes', 'views', 'saves'];
    if (!validFields.includes(field)) {
      return res.status(400).json({ error: `Geçersiz alan: ${field}` });
    }

    // Alanı 1 artır
    const updatedStory = await StoryFromModel.Story.findByIdAndUpdate(
      storyId,
      { $inc: { [field]: 1 } }, // `$inc` ile alanı artır
      { new: true } // Güncellenmiş dökümanı döndür
    );

    if (!updatedStory) {
      return res.status(404).json({ error: 'Hikaye bulunamadı!' });
    }

    res.status(200).json({
      message: `${field} alanı başarıyla artırıldı!`,
      story: updatedStory,
    });
  } catch (error) {
    console.error('Hata:', error.message);
    res.status(500).json({ error: 'Güncelleme sırasında bir hata oluştu.' });
  }
});

module.exports = router;
