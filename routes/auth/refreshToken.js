
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const authenticateToken = require('../../config/utils/authenticateToken');

// routes/authRoutes.js
router.post('/refreshToken', authenticateToken, async (req, res) => {
    try {
        const userEmail = req.user.email;
        
        // Yeni token oluştur (90 gün)
        const newToken = jwt.sign(
            { id: req.user.id, email: userEmail },
            'your-secret-key',
            { expiresIn: '90d' }
        );

        res.status(200).json({
            message: 'Token refreshed successfully',
            token: newToken
        });
    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({ error: 'Token refresh failed' });
    }
});

module.exports = router;