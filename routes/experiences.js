var express = require('express');
var router = express.Router();

/* GET experiences default route. */
router.get('/', function(req, res, next) {
  res.send('Experience service is running');
});

module.exports = router;
