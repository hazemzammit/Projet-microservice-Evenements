const express = require('express');
const router = express.Router();  

const experienceController = require('../controlleur/experienceController');  
const Experience = require('../models/experience');
const validateExperience = require('../middl/validateExperience');



router.post('/add', validateExperience.validateExperience ,experienceController.add); 
router.get('/show', experienceController.show);

router.get('/showbyid/:id',experienceController.showbyid);

router.put('/update/:id', experienceController.update); 

router.delete('/delete/:id', experienceController.deleteexperience); 

router.get('/statistics', experienceController.getStatistics);

router.post('/addComment/:id', experienceController.addComment);

router.get('/comments/:id', experienceController.getComments);

router.post('/like', experienceController.likeExperience);

module.exports = router;
