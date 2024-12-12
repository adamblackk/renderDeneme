const express = require('express');
const router = express.Router();
const UserfromModel = require('../config/models/auth')


router.put('/updateUser', async (req, res) => {
    try {
      const { name,email,age} = req.body; // Güncelleme için gelen veriler
  
      // Güncelleme işlemi
      const updatedUser = await UserfromModel.User.findOneAndUpdate(
        { email: email }, // Eşleşme kriterleri
        { name: name,
          age :age
         }, // Güncellenen alan
        { new: true } // Güncellenmiş belgeyi döndür
      );
  
      // Eğer kullanıcı bulunamazsa
      if (!updatedUser) {
        return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
      }
  
      // Başarılı yanıt
      res.status(200).json({
        message: 'Kullanıcı başarıyla güncellendi.',
        user: updatedUser,
      });
    } catch (error) {
      console.error('Hata:', error.message);
  
      // Hata yanıtı
      res.status(500).json({ error: 'Kullanıcı güncelleme sırasında bir hata oluştu.' });
    }
  });
  


  module.exports = router;