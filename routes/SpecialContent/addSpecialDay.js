const express = require('express');
const router = express.Router();
const authenticateToken = require('../../config/utils/authenticateToken');
const SpecialDayModel = require('../../config/models/specialDayModel');

router.post('/addSpecialDay', authenticateToken, async (req, res) => {
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
        const supportedLanguages = ['tr', 'en', 'es'];
        if (!supportedLanguages.includes(lang)) {
            return res.status(400).json({ 
                success: false,
                error: 'Desteklenmeyen dil!',
                supportedLanguages
            });
        }

        // Zorunlu alanların kontrolü - yeni alanları opsiyonel bırakıyoruz
        const requiredFields = ['title', 'message', 'imageUrl', 'type', 'startDate', 'endDate'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Eksik alanlar mevcut!',
                missingFields
            });
        }

        // Collection seçimi
        const collectionName = `SpecialDay_${lang}`;
        const SpecialDayCollection = SpecialDayModel[collectionName];

        // Yeni özel gün oluştur - yeni alanları da ekledik
        const newSpecialDay = new SpecialDayCollection({
            title: req.body.title,
            message: req.body.message,
            imageUrl: req.body.imageUrl,
            type: req.body.type,
            startDate: new Date(req.body.startDate),
            endDate: new Date(req.body.endDate),
            isActive: req.body.isActive ?? true,
            isClickable: req.body.isClickable ?? false, // Yeni alan, varsayılan false
            redirectUrl: req.body.redirectUrl || null    // Yeni alan, varsayılan null
        });

        // Kaydet
        await newSpecialDay.save();

        res.status(201).json({
            success: true,
            message: 'Özel gün başarıyla eklendi',
            data: newSpecialDay
        });

    } catch (error) {
        console.error('Hata:', error);
        res.status(500).json({ 
            success: false,
            error: 'Özel gün eklenirken bir hata oluştu.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;