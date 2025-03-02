const express = require('express');
const router = express.Router();
const UserfromModel = require('../../config/models/auth');
const authenticateToken = require('../../config/utils/authenticateToken'); // Middleware'i içe aktarın

// E-posta doğrulama fonksiyonu
function validateEmail(email) {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

router.post('/deleteUser',authenticateToken, async (req, res) => {
  try {
    const { email } = req.body;

    // Zorunlu alan kontrolü
    if (!email) {
      return res.status(400).json({ error: 'E-posta alanı zorunludur.' });
    }

    // E-posta format kontrolü
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Geçersiz e-posta formatı.' });
    }

    // Kullanıcı silme işlemi
    const result = await UserfromModel.User.deleteOne({ email: email });

    // Kullanıcı bulunamadıysa
    if (result.deletedCount === 0) {
      return res.status(404).json({
        removedState:false,
         message: 'Kullanıcı bulunamadı.' });
    }

    // Başarılı yanıt
    res.status(200).json({
       removedState:true,
       message: 'Kullanıcı başarıyla silindi.'
      });
  } catch (error) {
    console.error('Hata:', error.message);

    // Hata yanıtı
    res.status(500).json({ error: 'Kullanıcı silme sırasında bir hata oluştu.' });
  }
});

module.exports = router;
