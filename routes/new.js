var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/new', function(req, res, next) {
  res.send('Hello you are in the newRouter Cong bro.....');
});

module.exports = router;
