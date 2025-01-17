const express = require('express');
const router = express.Router();
const authenticateToken = require('../../config/utils/authenticateToken'); // Middleware'i içe aktarın
const CategoryFromModel = require('../../config/models/storyCategoryModel');

router.get('/getCategories', authenticateToken, async (req, res) => {
    try {
      const categories = await CategoryFromModel.StoryCategory.find().select('-__v');
      res.status(200).json(categories);
    } catch (error) {
      console.error('Hata:', error.message);
      res.status(500).json({ error: 'Kategoriler alınırken bir hata oluştu.' });
    }
  });
  
  
  

module.exports = router;