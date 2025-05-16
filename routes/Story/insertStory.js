const express = require('express');
const router = express.Router();
const authenticateToken = require('../../config/utils/authenticateToken'); // Middleware'i içe aktarın
const StoryFromModel = require('../../config/models/storyModel');


router.post('/insertStories', authenticateToken, async (req, res) => {
    try {
        // Dil parametresi zorunlu
        if (!req.body.lang) {
            return res.status(400).json({ 
                error: 'Dil parametresi (lang) zorunludur! Desteklenen diller: tr, en, es' 
            });
        }

        const lang = req.body.lang;

        // Desteklenen dilleri kontrol et
        const supportedLanguages = ['tr', 'en', 'es'];
        if (!supportedLanguages.includes(lang)) {
            return res.status(400).json({ 
                error: 'Desteklenmeyen dil! Desteklenen diller: tr, en, es' 
            });
        }

        // Collection adını belirle
        const collectionName = `Story_${lang}`;
        const StoryCollection = StoryFromModel[collectionName];

        // Gelen veriyi array'e çevir (tek veya çoklu)
        const stories = Array.isArray(req.body.stories) ? req.body.stories : [req.body.stories];

        // Boş kontrol
        if (!stories || stories.length === 0) {
            return res.status(400).json({ 
                error: 'Hikaye verisi gönderilmedi!' 
            });
        }

        // Benzersiz başlık kontrolü
        const existingTitles = await StoryCollection.find({
            title: { $in: stories.map(story => story.title) }
        }).select('title');

        if (existingTitles.length > 0) {
            return res.status(400).json({
                error: 'Bazı hikayeler zaten mevcut!',
                duplicates: existingTitles.map(story => story.title)
            });
        }

        // Hikayeleri hazırla
        const storiesToInsert = stories.map(story => ({
            title: story.title,
            content: story.content,
            description:story.description,
            imageUrl: story.imageUrl,
            category: story.category,
            discipline: story.discipline,
            mainCharacter: story.mainCharacter,
            readingTime: story.readingTime,
            tags: story.tags || [],
            stats: {
                views: 0,
                likes: 0,
                saves: 0,
                shares: 0
            },
            isPremium: story.isPremium || false
        }));

        // Ekleme yap
        const result = await StoryCollection.insertMany(storiesToInsert);

        res.status(201).json({
            message: `${result.length} hikaye ${lang} diline başarıyla eklendi!`,
            language: lang,
            count: result.length,
            insertedIds: result.map(story => story._id)
        });

    } catch (error) {
        console.error('Hata:', error.message);
        res.status(500).json({ 
            error: 'Hikaye eklenirken bir hata oluştu.',
            details: error.message 
        });
    }
});

  


module.exports = router;
