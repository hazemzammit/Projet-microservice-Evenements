const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');

router.get('/', productController.getProducts);
router.get('/:id', productController.getProduct);
router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

// Avancés
router.get('/promotions', productController.getPromotionalProducts);
router.get('/top', productController.getTopProducts);
router.get('/:id/similar', productController.getSimilarProducts);

module.exports = router;
