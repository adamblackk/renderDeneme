
const express = require('express');
const router = express.Router();
const authenticateToken = require('../../config/utils/authenticateToken'); // Middleware'i içe aktarın
const CategoryFromModel = require('../../config/models/storyCategoryModel');

router.post('/addCategory', authenticateToken, async (req, res) => {
    try {
        

        const { imageUrl, isPremium, category } = req.body;

        // Validation
        if (!category || !imageUrl) {
            return res.status(400).json({ 
                error: 'category ve imageUrl alanları zorunludur.' 
            });
        }

        // Yeni kategori oluştur
        const newCategory = new CategoryFromModel.StoryCategory({
            category: category.trim(), // Boşlukları temizle
            imageUrl: imageUrl.trim(),
            isPremium: Boolean(isPremium) // Boolean'a çevir
        });

        // Kaydet
        const savedCategory = await newCategory.save();

        res.status(201).json({
            message: 'Kategori başarıyla eklendi',
            category: savedCategory
        });

    } catch (error) {
        // Duplicate key hatası kontrolü
        if (error.code === 11000) {
            return res.status(400).json({ 
                error: 'Bu kategori zaten mevcut.' 
            });
        }

        console.error('Hata:', error);
        res.status(500).json({ 
            error: 'Kategori eklenirken bir hata oluştu.' 
        });
    }
});


module.exports = router