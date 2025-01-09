var express = require('express');
var router = express.Router();
const UserfromModel = require('../../config/models/auth');
const authenticateToken = require('../../config/utils/authenticateToken'); // Middleware'i içe aktarın

// E-posta doğrulama fonksiyonu
function validateEmail(email) {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

// Belirli bir email parametresine göre kullanıcıyı getir
router.post('/getUserWithEmail',authenticateToken, async (req, res) => {
  try {
    const { email } = req.body; // Body'den 'email' değerini al

    // E-posta kontrolü
    if (!email) {
      return res.status(400).json({ error: 'Lütfen bir email parametresi sağlayın.' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Geçersiz e-posta formatı.' });
    }

    // Veritabanından email değerine göre kullanıcıyı ara
    const user = await UserfromModel.User.findOne({ email })
      .select('-_id -__v'); // `_id` ve `__v` alanlarını hariç tut

    if (!user) {
      return res.status(404).json({ error: 'Belirtilen e-posta ile kullanıcı bulunamadı.' });
    }

    res.status(200).json(user); // Kullanıcıyı JSON formatında döndür
  } catch (error) {
    console.error('Hata:', error.message);
    res.status(500).json({ error: 'Kullanıcı bilgileri alınırken bir hata oluştu.' });
  }
});

module.exports = router;
