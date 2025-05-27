const express = require('express');
const router = express.Router();
const authenticateToken = require('../../config/utils/authenticateToken');
const Attribution = require('../../config/models/attributionModel');

// Tekil veya toplu yükleme
router.post('/addAttribution', authenticateToken, async (req, res) => {
  try {
    const payload = req.body;

    console.log('BODY:', req.body);

    const normalize = (entry) => {
      const requiredFields = ['title', 'originalAuthor', 'sourcePlatform', 'sourceTitle', 'licenseName'];
      for (const field of requiredFields) {
        if (!entry[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      return {
        title: entry.title.trim(),
        originalAuthor: entry.originalAuthor.trim(),
        sourcePlatform: entry.sourcePlatform.trim(),
        sourceTitle: entry.sourceTitle.trim(),
        sourceUrl: entry.sourceUrl?.trim(),
        licenseName: entry.licenseName.trim(),
        licenseShort: entry.licenseShort?.trim(),
        licenseUrl: entry.licenseUrl?.trim(),
        modifiedFromOriginal: Boolean(entry.modifiedFromOriginal),
        description: entry.description?.trim() || ''
      };
    };

    // Eğer dizi geldiyse toplu ekle
    if (Array.isArray(payload)) {
      const docs = payload.map(normalize);
      const inserted = await Attribution.insertMany(docs);
      return res.status(201).json({
        success: true,
        message: `${inserted.length} attribution(s) added successfully.`,
        attributions: inserted
      });
    }

    // Tek bir obje geldiyse
    const single = normalize(payload);
    const saved = await new Attribution(single).save();

    res.status(201).json({
      success: true,
      message: 'Attribution added successfully.',
      attribution: saved
    });

  } catch (err) {
    console.error('Attribution creation error:', err);
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

module.exports = router;
