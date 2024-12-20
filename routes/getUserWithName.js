var express = require('express');
var router = express.Router();
const UserfromModel = require('../config/models/auth');

// Belirli bir name parametresine göre kullanıcıyı getir
router.get('/getUserWithName', async (req, res) => {
  try {
    const { name } = req.body; // Query parametrelerinden 'name' değerini al

    if (!name) {
      return res.status(400).json({ error: 'Lütfen bir name parametresi sağlayın.' });
    }

    // Veritabanından name değerine göre kullanıcıyı ara
    const users = await UserfromModel.User.find({ name: name }); // `find` ile eşleşen tüm belgeleri getir

    if (users.length === 0) {
      return res.status(404).json({ error: 'Belirtilen isimde kullanıcı bulunamadı.' });
    }

    res.status(200).json(users); // JSON formatında döndür
  } catch (error) {
    console.error('Hata:', error.message);
    res.status(500).json({ error: 'Kullanıcı bilgileri alınırken bir hata oluştu.' });
  }
});

module.exports = router;