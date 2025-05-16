const express = require('express');
const router = express.Router();
const { Story_tr, Story_en, Story_es } = require('../../../config/models/storyModel'); // Model dosya yoluna göre güncelle

// GET endpoint: eksik alanı ekler
router.get('/add-audio-field-if-missing', async (req, res) => {
  try {
    const updateResult = await Promise.all([
      Story_tr.updateMany(
        { audioVariants: { $exists: false } },
        { $set: { audioVariants: [] } }
      ),
      Story_en.updateMany(
        { audioVariants: { $exists: false } },
        { $set: { audioVariants: [] } }
      ),
      Story_es.updateMany(
        { audioVariants: { $exists: false } },
        { $set: { audioVariants: [] } }
      )
    ]);

    res.json({
      message: 'Eksik olan tüm dökümanlara audioVariants alanı eklendi.',
      results: {
        tr: updateResult[0].modifiedCount,
        en: updateResult[1].modifiedCount,
        es: updateResult[2].modifiedCount
      }
    });
  } catch (err) {
    console.error('Hata:', err);
    res.status(500).json({ error: 'Alan eklenirken bir hata oluştu.' });
  }
});

module.exports = router;
