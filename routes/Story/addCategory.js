const express = require('express');
const router = express.Router();
const authenticateToken = require('../../config/utils/authenticateToken');
const CategoryFromModel = require('../../config/models/storyCategoryModel');

router.post('/addCategory', authenticateToken, async (req, res) => {
    try {
        const { imageUrl, isPremium, category, lang } = req.body;

        // Dil kontrolü
        if (!lang) {
            return res.status(400).json({ 
                success: false,
                error: 'Dil parametresi (lang) zorunludur!',
                supportedLanguages: ['tr', 'en', 'es']
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

        // Diğer alan kontrolleri
        if (!category || !imageUrl) {
            return res.status(400).json({ 
                success: false,
                error: 'category ve imageUrl alanları zorunludur.' 
            });
        }

        // Collection adını belirle
        const collectionName = `StoryCategory_${lang}`;
        const CategoryCollection = CategoryFromModel[collectionName];

        if (!CategoryCollection) {
            return res.status(404).json({ 
                success: false,
                error: `${lang} dili için kategori collection'ı bulunamadı`
            });
        }

        // Kategori zaten var mı kontrol et
        const existingCategory = await CategoryCollection.findOne({ 
            category: category.trim() 
        });

        if (existingCategory) {
            return res.status(400).json({ 
                success: false,
                error: `Bu kategori ${lang} dilinde zaten mevcut.`
            });
        }

        // Yeni kategori oluştur
        const newCategory = new CategoryCollection({
            category: category.trim(),
            imageUrl: imageUrl.trim(),
            isPremium: Boolean(isPremium)
        });

        // Kaydet
        const savedCategory = await newCategory.save();

        res.status(201).json({
            success: true,
            message: `Kategori ${lang} diline başarıyla eklendi`,
            language: lang,
            category: savedCategory
        });

    } catch (error) {
        console.error('Hata:', error);
        res.status(500).json({ 
            success: false,
            error: 'Kategori eklenirken bir hata oluştu.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;