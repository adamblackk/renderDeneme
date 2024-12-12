var express = require('express');
var router = express.Router();
const UserfromModel = require('../config/models/auth')


router.get('/getUser', async (req, res) => {
  try {
    // Veritabanından tüm kullanıcıları al
    const users = await UserfromModel.User.find(); // Mongoose `find()` ile tüm belgeleri getirir
    res.status(200).json(users); // JSON formatında döndür
  } catch (error) {
    console.error('Hata:', error.message);
    res.status(500).json({ error: 'Kullanıcı bilgileri alınırken bir hata oluştu.' });
  }
});


module.exports = router;
