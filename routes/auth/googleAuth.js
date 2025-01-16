const express = require('express');
const jwt = require('jsonwebtoken'); // JWT kütüphanesi
const { OAuth2Client } = require('google-auth-library');
const router = express.Router();
const UserfromModel = require('../../config/models/auth');
require('dotenv').config();

// Google OAuth Client ID
const Client_ID = process.env.CLIENT_ID; // Google Console'dan alınan Client ID
const client = new OAuth2Client(Client_ID);

/* POST: Google Login veya Kayıt */
router.post('/googleAuth', async (req, res) => {
    try {
        // Body'den gelen Google ID Token
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({ error: 'Google ID Token gerekli.' });
        }

        // ID Token'ı doğrula
        let payload;
        try {
            const ticket = await client.verifyIdToken({
                idToken,
                audience: Client_ID, // Doğru Client ID ile eşleşme
            });

            payload = ticket.getPayload(); // Kullanıcı bilgilerini al
        } catch (error) {
            return res.status(401).json({ error: 'Geçersiz Google ID Token.' });
        }

        const email = payload.email; // Kullanıcının e-posta adresi
        const name = payload.name; // Kullanıcının adı
        const picture = payload.picture; // Profil resmi

        // Kullanıcıyı veritabanında kontrol et
        let user = await UserfromModel.User.findOne({ email });

        if (!user) {
            try {
                user = new UserfromModel.User({
                    email,
                    password: "",
                    isActive: true,
                });
                await user.save();
            } catch (error) {
                console.error("Kullanıcı kaydedilemedi:", error.message);
                return res.status(500).json({ error: "Kullanıcı kaydedilemedi. Lütfen tekrar deneyin." });
            }
        }

        // Kullanıcı zaten varsa veya kayıt edildiyse, JWT oluştur
        const token = jwt.sign(
            { id: user._id, email: user.email },
            'your-secret-key', // Güvenli bir anahtar
            { expiresIn: '30d' } // Token geçerlilik süresi
        );

        // Başarılı yanıt döndür
        res.status(200).json({
            messageState: true,
            email: user.email,
            token,
        });
    } catch (error) {
        console.error('Hata:', error.message);

        // Genel hata yanıtı
        res.status(500).json({ error: 'Kimlik doğrulama sırasında bir hata oluştu.' });
    }
});

module.exports = router;
