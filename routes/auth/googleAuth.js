
const express = require('express');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const router = express.Router();
const UserfromModel = require('../../config/models/auth');


router.post('/googleAuth', async (req, res) => {
    try {
        const { idToken } = req.body;
        
        // Basic token kontrolü
        const decodedToken = jwt.decode(idToken);
        if (!decodedToken || !decodedToken.email) {
            return res.status(401).json({ error: 'Geçersiz token' });
        }

        const email = decodedToken.email;

        // Kullanıcıyı veritabanında kontrol et
        let user = await UserfromModel.User.findOne({ email });

        if (!user) {
            user = new UserfromModel.User({
                email,
                password: "",
                isActive: true,
            });
            await user.save();
        }

        // JWT oluştur
        const token = jwt.sign(
            { id: user._id, email: user.email },
            'your-secret-key',
            { expiresIn: '90d' }
        );

        res.status(200).json({
            messageState: true,
            user: {
                email: user.email
            },
            token
        });

    } catch (error) {
        console.error('Auth error:', error);
        res.status(500).json({ error: 'Kimlik doğrulama hatası' });
    }
});

module.exports = router;