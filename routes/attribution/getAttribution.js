
const express = require('express');
const router = express.Router();
const Attribution = require('../../config/models/attributionModel');

// GET all attributions 
router.get('/getAttributions', async (req, res) => {
  try {
    const attributions = await Attribution.find().sort({ title: 1 }); // isteğe bağlı sıralama
    res.status(200).json(attributions);
  } catch (err) {
    console.error('Error fetching attributions:', err);
    res.status(500).json({ error: 'Failed to fetch attributions' });
  }
});

module.exports = router;
