const express = require('express');
const router = express.Router();
const authenticateToken = require('../../config/utils/authenticateToken');
const StoryFromModel = require('../../config/models/storyModel');

router.patch('/incrementStoryField', authenticateToken, async (req, res) => {
  try {
    const { storyId, field, lang } = req.body;

    // Tüm gerekli alanların kontrolü
    if (!storyId || !field || !lang) {
      return res.status(400).json({ 
        success: false,
        error: 'Gerekli alanlar eksik! (storyId, field, lang zorunludur)'
      });
    }

    // Desteklenen dilleri kontrol et
    const supportedLanguages = ['tr', 'en', 'es'];
    if (!supportedLanguages.includes(lang)) {
      return res.status(400).json({ 
        success: false,
        error: 'Desteklenmeyen dil!',
        supportedLanguages
      });
    }

    // Desteklenen alanlar kontrolü
    const validFields = ['views', 'likes', 'saves', 'shares'];
    if (!validFields.includes(field)) {
      return res.status(400).json({ 
        success: false,
        error: `Geçersiz alan: ${field}`,
        validFields
      });
    }

    // Collection adını oluştur ve collection'ı seç
    const collectionName = `Story_${lang}`;
    const StoryCollection = StoryFromModel[collectionName];

    if (!StoryCollection) {
      return res.status(404).json({ 
        success: false,
        error: `${lang} dili için collection bulunamadı`
      });
    }

    // stats objesi içindeki alanı 1 artır
    const updatedStory = await StoryCollection.findByIdAndUpdate(
      storyId,
      { $inc: { [`stats.${field}`]: 1 } },
      { 
        new: true,
        select: 'title stats' // Sadece gerekli alanları döndür
      }
    );

    if (!updatedStory) {
      return res.status(404).json({ 
        success: false,
        error: `${lang} dilinde belirtilen ID'ye sahip hikaye bulunamadı!`
      });
    }

    res.status(200).json({
      success: true,
      language: lang,
      story: {
        id: updatedStory._id,
        title: updatedStory.title,
        stats: updatedStory.stats
      }
    });

  } catch (error) {
    console.error('Hata:', error);
    res.status(500).json({ 
      success: false,
      error: 'İşlem sırasında bir hata oluştu.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
