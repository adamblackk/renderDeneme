const express = require('express');
const router = express.Router();
const UserfromModel = require('../config/models/auth')

/* POST: Kullanıcı Ekleme */
router.post('/addUser', async (req, res) => {
  try {
    // Postman'den gelen kullanıcı verilerini al
    const { name, email, age } = req.body;

    // Yeni kullanıcı oluştur ve kaydet
    const newUser = new UserfromModel.User({ name, email, age });
    const savedUser = await newUser.save();

    // Başarılı yanıt döndür
    res.status(201).json({
      message: 'Kullanıcı başarıyla kaydedildi!',
      user: savedUser,
    });
  } catch (error) {
    console.error('Hata:', error.message);

    // Hata yanıtı
    res.status(500).json({ error: 'Kullanıcı ekleme sırasında bir hata oluştu.' });
  }
});

module.exports = router;
