const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Erişim izni reddedildi.' });
  }

  jwt.verify(token, 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Geçersiz token.' });
    }
    req.user = user; // Doğrulanan kullanıcı bilgilerini isteğe ekleyin
    next();
  });
}

module.exports = authenticateToken;