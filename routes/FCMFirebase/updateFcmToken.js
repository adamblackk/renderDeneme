// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { User } = require('../../config/models/auth');
const authenticateToken = require('../../config/utils/authenticateToken');

router.post('/updateFcmToken', authenticateToken, async (req, res) => {
  try {
    const { fcmToken, timezone } = req.body;
    const userEmail = req.user.email; // Token'dan gelen email

    console.log(timezone)
    console.log(userEmail)

    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // FCM token ve timezone güncelleme
    user.fcmToken = fcmToken;
    if (timezone) {
      user.timezone = timezone;
    }
    await user.save();

    console.log(`Settings updated for user: ${userEmail}`, {
      fcmToken: fcmToken ? 'Updated' : 'Not provided',
      timezone: timezone || 'Not updated'
    });

    res.status(200).json({ 
      message: 'User settings updated successfully',
      timezone: user.timezone
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;