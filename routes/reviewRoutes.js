const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const {validateCreate,validateUpdate,validateResponse} = require('../middlewares/validateReview');


router.post('/evenement/:evenementId/create',validateCreate,reviewController.createReview);
router.get('/evenement/:evenementId',reviewController.getReviewsByEvenement);
router.get('/:id',reviewController.getReviewById);
router.put('/:id',validateUpdate,reviewController.updateReview);
router.delete('/:id',reviewController.deleteReview);



router.post('/:id/like',reviewController.likeReview);
router.post('/:id/reponse',validateResponse,reviewController.addOrganisateurResponse);
router.post('/:id/signaler', reviewController.flagReview);
router.get('/evenement/:evenementId/stats',reviewController.getReviewStatistics);
router.get('/utilisateur/:utilisateurId/avis',reviewController.getReviewsByUser);

module.exports = router;