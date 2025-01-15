const express = require('express');
const router = express.Router();
const TempPasswordResetCodeFromModel = require('../../config/models/tempPasswordResetCodeModel')




router.post('/verifyResetCode', async (req, res) => {
    const { email, resetCode } = req.body;

    // Veritabanından kayıtlı kodu al
    const record = await TempPasswordResetCodeFromModel.findOne({ email });
    if (!record) {
        return res.status(404).json({ error: 'Reset code not found' });
    }

    // Kodun geçerliliğini kontrol et
    if (record.resetCode !== resetCode) {
        return res.status(400).json({ error: 'Invalid reset code' });
    }

    if (new Date() > record.expiry) {
        return res.status(400).json({ error: 'Reset code has expired' });
    }

    res.status(200).json({ message: 'Reset code verified' });
});

module.exports = router
