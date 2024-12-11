var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/adem', function(req, res, next) {
  res.send('Hello how are you bro');
});

module.exports = router;
