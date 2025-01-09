const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const UserfromModel = require('../../config/models/auth');
const BlacklistedToken = require('../../config/models//blackListedTokenModel'); // Kara liste modelini içe aktarın

/* POST: Kullanıcı Çıkış */
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token sağlanmadı.' });
    }

    // Token'ı kara listeye ekle
    await new BlacklistedToken({ token }).save();

    // Token'dan kullanıcı ID'sini al
    const decoded = jwt.verify(token, 'your-secret-key');
    const userId = decoded.id;

    // Kullanıcının isActive durumunu false yap
    await UserfromModel.User.findByIdAndUpdate(userId, { isActive: false });

    res.status(200).json({ message: 'Başarıyla çıkış yapıldı.' });
  } catch (error) {
    console.error('Hata:', error.message);
    res.status(500).json({ error: 'Çıkış işlemi sırasında bir hata oluştu.' });
  }
});



module.exports = router