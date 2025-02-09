const express = require('express');
const router = express.Router();
const authenticateToken = require('../../config/utils/authenticateToken');
const CategoryFromModel = require('../../config/models/storyCategoryModel');

router.get('/getCategories', authenticateToken, async (req, res) => {
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
        const collectionName = `StoryCategory_${lang}`;
        const CategoryCollection = CategoryFromModel[collectionName];

        if (!CategoryCollection) {
            return res.status(404).json({ 
                success: false,
                error: `${lang} dili için kategori collection'ı bulunamadı`
            });
        }

        // Kategorileri al
        const categories = await CategoryCollection
            .find()
            .select('-__v')
            .lean()
            .exec();

        // Boş data kontrolü
        if (!categories.length) {
            return res.status(404).json({
                success: false,
                error: `${lang} dilinde henüz kategori bulunmuyor`
            });
        }

        res.status(200).json({
            success: true,
            language: lang,
            count: categories.length,
            categories
        });

    } catch (error) {
        console.error('Hata:', error);
        res.status(500).json({ 
            success: false,
            error: 'Kategoriler alınırken bir hata oluştu.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;