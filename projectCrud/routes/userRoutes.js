const express = require('express');
const router = express.Router();
const User = require('../models/user');

router.get('/add/:username/:email/:cin', async (req, res) => {
    try {
        const user = new User({
            username: req.params.username,
            email: req.params.email,
            cin: req.params.cin
        });

        await user.save();
        res.send('good added');
    } catch (err) {
        res.send('error adding user');
    }
});

router.get('/show', async (req, res) => {
    try {
        const users = await User.find();
        res.send(users);
    } catch (err) {
        res.send('error');
    }
});

router.get('/showbyid/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.send('user not found');
        }

        res.send(user);
    } catch (err) {
        res.send('error finding user');
    }
});

router.get('/showbyusername/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });

        if (!user) {
            return res.send('user not found');
        }

        res.send(user);
    } catch (err) {
        res.send('error searching user');
    }
});
router.post('/add', async (req,res) => {
    try {
          console.log(req.body);

        const user = new User(req.body);

        await user.save();
        res.send('user added successfully');
    } catch (err) {
        res.send(err);
    }
});


module.exports = router;
