const express = require('express');
const router = express.Router();
const authenticateToken = require('../../config/utils/authenticateToken'); // Middleware'i içe aktarın
const StoryFromModel = require('../../config/models/storyModel');

// POST: Güncellenmiş Hikayeleri Al
router.post('/getUpdatedStories', async (req, res) => {
  try {
    const { updatedSince } = req.body; // Body'den tarih al

    // updatedSince alanı zorunlu
    if (!updatedSince) {
      return res.status(400).json({ error: 'updatedSince alanı zorunludur!' });
    }

    // Tarih formatı kontrolü
    const sinceDate = new Date(updatedSince);
    if (isNaN(sinceDate)) {
      return res.status(400).json({ error: 'Geçersiz tarih formatı!' });
    }

    // Güncellenmiş hikayeleri çek
    const updatedStories = await StoryFromModel.Story.find({
      updatedAt: { $gt: sinceDate },
    }).select('-__v');

    res.status(200).json({
      message: 'Güncellenmiş hikayeler başarıyla alındı!',
      count: updatedStories.length,
      stories: updatedStories,
    });
  } catch (error) {
    console.error('Hata:', error.message);
    res.status(500).json({ error: 'Güncellenmiş hikayeler alınırken bir hata oluştu.' });
  }
});

module.exports = router;
