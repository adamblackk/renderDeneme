
const express = require('express');
const router = express.Router();
const authenticateToken = require('../../config/utils/authenticateToken');
const SpecialDayModel = require('../../config/models/specialDayModel'); // Model yolunu ayarlayın

router.post('/getSpecialDay', authenticateToken, async (req, res) => {
    try {
        // Dil parametresi kontrolü
        if (!req.body.lang) {
            return res.status(400).json({ 
                success: false,
                error: 'Dil parametresi (lang) zorunludur!',
                supportedLanguages: ['tr', 'en', 'es']
            });
        }

        const lang = req.body.lang;

        // Desteklenen dilleri kontrol et
        const supportedLanguages = ['tr', 'en', 'es'];
        if (!supportedLanguages.includes(lang)) {
            return res.status(400).json({ 
                success: false,
                error: 'Desteklenmeyen dil!',
                supportedLanguages
            });
        }

        // Collection adını oluştur
        const collectionName = `SpecialDay_${lang}`;
        const SpecialDayCollection = SpecialDayModel[collectionName];

        if (!SpecialDayCollection) {
            return res.status(404).json({ 
                success: false,
                error: `${lang} dili için özel gün collection'ı bulunamadı`
            });
        }

        // Aktif özel günü al
        const now = new Date();
        const specialDay = await SpecialDayCollection
            .findOne({
                isActive: true,
                startDate: { $lte: now },
                endDate: { $gte: now }
            })
            .select('-__v')
            .lean()
            .exec();

        // Aktif özel gün kontrolü
        if (!specialDay) {
            return res.status(404).json({
                success: false,
                error: `${lang} dilinde aktif özel gün bulunmuyor`
            });
        }

        res.status(200).json(
            specialDay
        );

    } catch (error) {
        console.error('Hata:', error);
        res.status(500).json({ 
            success: false,
            error: 'Özel gün bilgisi alınırken bir hata oluştu.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;