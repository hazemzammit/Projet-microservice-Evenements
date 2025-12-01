const productService = require('../services/product.service');

exports.getProducts = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;
    const filters = {};
    if (category) filters.category = category;
    if (search) filters.name = { $regex: search, $options: 'i' };
    const products = await productService.getAllProducts(filters, parseInt(page), parseInt(limit));
    res.json(products);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getProduct = async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createProduct = async (req, res) => {
  try { const product = await productService.createProduct(req.body); res.status(201).json(product); }
  catch (err) { res.status(400).json({ message: err.message }); }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) { res.status(400).json({ message: err.message }); }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await productService.deleteProduct(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Avancés
exports.getPromotionalProducts = async (req, res) => {
  try { const products = await productService.getPromotionalProducts(); res.json(products); }
  catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getTopProducts = async (req, res) => {
  try { const products = await productService.getTopProducts(); res.json(products); }
  catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getSimilarProducts = async (req, res) => {
  try {
    const products = await productService.getSimilarProducts(req.params.id);
    res.json(products);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
