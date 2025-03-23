var express = require('express');
var router = express.Router();

/* GET policy page. */
router.get('/policy', function(req, res, next) {
  res.render('policyes', { title: 'Privacy Policy' });
});

module.exports = router;
