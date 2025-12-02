const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');

// IMPORTANT: Advanced routes with specific paths MUST come BEFORE /:id
// to avoid path matching conflicts

// Advanced routes (MUST BE FIRST)
router.get('/promotions', productController.getPromotionalProducts);
router.get('/top', productController.getTopProducts);

// Standard CRUD routes
router.get('/', productController.getProducts);
router.post('/', productController.createProduct);
router.get('/:id', productController.getProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

// Advanced route with ID parameter (can be after /:id since it's more specific)
router.get('/:id/similar', productController.getSimilarProducts);

module.exports = router;