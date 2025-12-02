const Category = require('../models/category.model');
const Product = require('../models/product.model');

exports.getAllCategories = () => Category.find();
exports.getCategoryById = (id) => Category.findById(id);
exports.createCategory = (data) => new Category(data).save();
exports.updateCategory = (id, data) => Category.findByIdAndUpdate(id, data, { new: true });
exports.deleteCategory = (id) => Category.findByIdAndDelete(id);

// Métiers avancés
exports.getPopularCategories = async () => {
  return Product.aggregate([
    { $group: { _id: "$category", totalSold: { $sum: "$sold" } } },
    { $sort: { totalSold: -1 } },
    { $limit: 5 },
    { $lookup: {
        from: "categories",
        localField: "_id",
        foreignField: "_id",
        as: "category"
    }},
    { $unwind: "$category" },
    { $project: { _id: 0, category: 1, totalSold: 1 } }
  ]);
};
