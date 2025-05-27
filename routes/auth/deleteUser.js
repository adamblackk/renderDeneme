

const express = require('express');
const router = express.Router();
const UserfromModel = require('../../config/models/auth');
const authenticateToken = require('../../config/utils/authenticateToken');

// Sadece token'dan gelen e-posta ile kullanıcıyı sil
router.post('/deleteUser', authenticateToken, async (req, res) => {
  try {
    const email = req.user.email; // Token'dan gelen email

    const result = await UserfromModel.User.deleteOne({ email });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        removedState: false,
        message: 'Kullanıcı bulunamadı.'
      });
    }

    res.status(200).json({
      removedState: true,
      message: 'Hesabınız başarıyla silindi.'
    });
  } catch (error) {
    console.error('Silme Hatası:', error.message);
    res.status(500).json({ error: 'Kullanıcı silme sırasında bir hata oluştu.' });
  }
});

module.exports = router;
