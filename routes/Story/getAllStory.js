const express = require('express');
const router = express.Router();
const authenticateToken = require('../../config/utils/authenticateToken');
const StoryFromModel = require('../../config/models/storyModel');

router.get('/getAllStory', authenticateToken, async (req, res) => {
    try {
        // Body'den dil parametresi kontrolü
        if (!req.body.lang) {
            return res.status(400).json({ 
                error: 'Dil parametresi (lang) zorunludur!',
                supportedLanguages: ['tr', 'en', 'es']
            });
        }

        const lang = req.body.lang;
        
        // Desteklenen dilleri kontrol et
        const supportedLanguages = ['tr', 'en', 'es'];
        if (!supportedLanguages.includes(lang)) {
            return res.status(400).json({ 
                error: 'Desteklenmeyen dil!',
                supportedLanguages
            });
        }

        // Collection adını oluştur ve collection'ı seç
        const collectionName = `Story_${lang}`;
        const StoryCollection = StoryFromModel[collectionName];
        
        if (!StoryCollection) {
            return res.status(404).json({ 
                error: `${lang} dili için içerik bulunamadı`
            });
        }

        // Data'yı al
        const stories = await StoryCollection.find()
            .select('-__v')
            .lean()
            .exec();
        
        // Boş data kontrolü
        if (!stories.length) {
            return res.status(404).json({
                error: `${lang} dilinde henüz hikaye bulunmuyor`
            });
        }

        res.status(200).json({
            language: lang,
            count: stories.length,
            stories
        });

    } catch (error) {
        console.error('Hata:', error);
        res.status(500).json({ 
            error: 'Hikayeler alınırken bir hata oluştu.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;