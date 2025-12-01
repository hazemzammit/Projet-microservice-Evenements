const Product = require('../models/product.model');

exports.getAllProducts = (filters = {}, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return Product.find(filters).populate('category').skip(skip).limit(limit);
};

exports.getProductById = (id) => Product.findById(id).populate('category');
exports.createProduct = (data) => new Product(data).save();
exports.updateProduct = (id, data) => Product.findByIdAndUpdate(id, data, { new: true });
exports.deleteProduct = (id) => Product.findByIdAndDelete(id);

// Métiers avancés
exports.getPromotionalProducts = () => Product.find({ discount: { $gt: 0 } }).populate('category');
exports.getTopProducts = () => Product.find().sort({ sold: -1 }).limit(5).populate('category');
exports.getSimilarProducts = (productId) =>
  Product.findById(productId).then(product => {
    if (!product) return [];
    return Product.find({ category: product.category, _id: { $ne: productId } }).limit(5).populate('category');
  });
