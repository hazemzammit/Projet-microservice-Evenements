const express = require('express');
const router = express.Router();
const evenementController = require('../controllers/evenementController');
const {validateCreate,validateUpdate} = require('../middlewares/validateEvenement');


router.post('/create',validateCreate,evenementController.createEvenement);
router.get('/all',evenementController.getAllEvenements);
router.get('/:id',evenementController.getEvenementById);
router.put('/update/:id',validateUpdate,evenementController.updateEvenement);
router.delete('/delete/:id',evenementController.deleteEvenement);



router.get('/recherche/avancee',evenementController.rechercheAvancee);
router.get('/stats/global',evenementController.getStatistiques);
router.get('/liste/avenir',evenementController.getEvenementsAvenir);
router.get('/organisateur/:organisateurId',evenementController.getEvenementsByOrganisateur);
router.get('/top/notes',evenementController.getTopRatedEvenements);
router.patch('/:id/reservations',evenementController.updateNombreReservations);
router.patch('/:id/annuler',evenementController.annulerEvenement);
router.post('/:id/dupliquer', evenementController.duplicateEvenement);
router.delete('/bulk/delete', evenementController.bulkDeleteEvenements);
router.put('/bulk/update', evenementController.bulkUpdateEvenements);


module.exports = router;