const express = require('express');
const router = express.Router();  
const userController = require('../controlleur/userController');  
const user = require('../models/user');
const validateUser = require('../middl/validate');

/*router.get('/add/:username/:email/:cin', (req, res) => {
    new User({
        username: req.params.username,
        email: req.params.email,    
        cin: req.params.cin
    }).save()
    res.send('user added');
});
*/

router.post('/adduser', validateUser.validate ,userController.add); 
router.get('/show', userController.show);

router.get('/showbyid/:id',userController.showbyid);

router.get('/showbyusername/:username', userController.showbyusername);


router.put('/update/:id', userController.update); 


router.delete('/delete/:id', userController.deleteuser); 



module.exports = router;
