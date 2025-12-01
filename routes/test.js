// ...existing code...
const express = require('express');
// ...existing code...
const router = express.Router();

router.get('/test', (req, res) => {
    res.send('hello 4 iosys');
});

module.exports = router;
// ...existing code...