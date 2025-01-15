const mongoose = require('mongoose');

const tempPasswordResetCodeSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true, // Her e-posta için bir kayıt
        lowercase: true, // Küçük harfe dönüştür
        trim: true // Boşlukları kaldır
    },
    resetCode: {
        type: String,
        required: true
    },
    expiry: {
        type: Date,
        required: true
    }
}, {
    timestamps: true // createdAt ve updatedAt alanlarını otomatik ekler
});

const TempPasswordResetCode = mongoose.model('TempPasswordResetCode', tempPasswordResetCodeSchema);

module.exports = TempPasswordResetCode;
