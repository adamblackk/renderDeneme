const express = require('express');
const router = express.Router();
const authenticateToken = require('../../config/utils/authenticateToken'); // Middleware'i içe aktarın
const UserfromModel = require('../../config/models/auth');

// `/getUser` endpoint'i
router.get('/getUser', authenticateToken, async (req, res) => {
  try {
    const users = await UserfromModel.User.find().select('-_id -__v');
    res.status(200).json(users);
  } catch (error) {
    console.error('Hata:', error.message);
    res.status(500).json({ error: 'Kullanıcı bilgileri alınırken bir hata oluştu.' });
  }
});

module.exports = router;