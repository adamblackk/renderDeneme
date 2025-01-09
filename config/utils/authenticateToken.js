const jwt = require('jsonwebtoken');
const BlacklistedToken = require('../models/blackListedTokenModel');

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Erişim izni reddedildi.' });
  }

  try {
    // Kara liste kontrolü
    const blacklisted = await BlacklistedToken.findOne({ token });
    if (blacklisted) {
      return res.status(403).json({ error: 'Geçersiz token from blackList.' });
    }

    // Token doğrulama
    jwt.verify(token, 'your-secret-key', (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Geçersiz token.' });
      }
      req.user = user; // Doğrulanan kullanıcı bilgilerini isteğe ekleyin
      next();
    });
  } catch (error) {
    console.error('Hata:', error.message);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

module.exports = authenticateToken;