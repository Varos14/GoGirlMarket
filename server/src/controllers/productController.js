const Product = require('../models/Product');
const Order = require('../models/Order');

// @desc    Fetch all products with filtering, search, and pagination
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  const pageSize = 12;
  const page = Number(req.query.pageNumber) || 1;

  // Search keyword
  const keyword = req.query.keyword
    ? {
        $or: [
          { name: { $regex: req.query.keyword, $options: 'i' } },
          { description: { $regex: req.query.keyword, $options: 'i' } },
          { category: { $regex: req.query.keyword, $options: 'i' } },
          { brand: { $regex: req.query.keyword, $options: 'i' } },
        ],
      }
    : {};

  // Category filter
  const category = req.query.category ? { category: req.query.category } : {};

  // Vendor filter
  const vendor = req.query.vendor ? { vendor: req.query.vendor } : {};

  const query = { ...keyword, ...category, ...vendor };

  let sortCriteria = { createdAt: -1 };
  if (req.query.sort === 'lowest') {
    sortCriteria = { price: 1 };
  } else if (req.query.sort === 'highest') {
    sortCriteria = { price: -1 };
  }

  try {
    const count = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('vendor', 'storeName')
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort(sortCriteria);

    res.json({ products, page, pages: Math.ceil(count / pageSize), count });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('vendor', 'storeName name email');
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Vendor
const createProduct = async (req, res) => {
  const { name, price, description, category, brand, countInStock, images } = req.body;
  
  if (!images || images.length === 0) {
    return res.status(400).json({ message: 'At least one image is required' });
  }

  try {
    const product = new Product({
      name,
      price,
      vendor: req.user._id,
      images,
      brand,
      category,
      countInStock,
      description,
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Vendor
const updateProduct = async (req, res) => {
  const { name, price, description, category, brand, countInStock, images } = req.body;

  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      // Ensure the logged in vendor is the owner
      if (product.vendor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to update this product' });
      }

      product.name = name || product.name;
      product.price = price || product.price;
      product.description = description || product.description;
      product.category = category || product.category;
      product.brand = brand || product.brand;
      product.countInStock = countInStock || product.countInStock;
      product.images = images || product.images;

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Vendor
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      // Ensure the logged in vendor is the owner
      if (product.vendor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to delete this product' });
      }

      await Product.deleteOne({ _id: product._id });
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private
const createProductReview = async (req, res) => {
  const { rating, comment } = req.body;

  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      const alreadyReviewed = product.reviews.find(
        (r) => r.user.toString() === req.user._id.toString()
      );

      if (alreadyReviewed) {
        return res.status(400).json({ message: 'Product already reviewed' });
      }

      // Check if user has purchased the item and it was paid for
      const orders = await Order.find({ user: req.user._id, isPaid: true });
      const hasPurchased = orders.some(order => 
        order.orderItems.some(item => item.product.toString() === req.params.id.toString())
      );

      if (!hasPurchased) {
        return res.status(400).json({ message: 'You can only review products you have purchased' });
      }

      const review = {
        name: req.user.name,
        rating: Number(rating),
        comment,
        user: req.user._id,
      };

      product.reviews.push(review);

      product.numReviews = product.reviews.length;

      product.rating =
        product.reviews.reduce((acc, item) => item.rating + acc, 0) /
        product.reviews.length;

      await product.save();
      res.status(201).json({ message: 'Review added' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const csv = require('csv-parser');
const stream = require('stream');

// @desc    Import products via CSV
// @route   POST /api/products/bulk
// @access  Private/Vendor
const importProductsCSV = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const results = [];
  const bufferStream = new stream.PassThrough();
  bufferStream.end(req.file.buffer);

  bufferStream
    .pipe(csv())
    .on('data', (data) => {
      // Clean keys in case of BOM or whitespace
      const cleanData = {};
      for (const key in data) {
        cleanData[key.trim().replace(/^[\uFEFF\xA0]+|[\uFEFF\xA0]+$/g, '')] = data[key];
      }

      // Basic validation: must have Name, Price
      if (cleanData.Name && cleanData.Price) {
        results.push({
          name: cleanData.Name,
          price: Number(cleanData.Price) || 0,
          description: cleanData.Description || '',
          category: cleanData.Category || 'General',
          brand: cleanData.Brand || 'Generic',
          countInStock: Number(cleanData.Stock) || 0,
          vendor: req.user._id,
          images: [], // Images will be empty as decided
        });
      }
    })
    .on('end', async () => {
      try {
        if (results.length === 0) {
          return res.status(400).json({ message: 'No valid products found in CSV. Make sure columns are named Name, Price, Stock, Description, Category, Brand.' });
        }
        
        await Product.insertMany(results);
        res.status(201).json({ message: `Successfully imported ${results.length} products`, count: results.length });
      } catch (error) {
        res.status(500).json({ message: 'Failed to insert products', error: error.message });
      }
    })
    .on('error', (error) => {
      res.status(500).json({ message: 'Error parsing CSV', error: error.message });
    });
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct, createProductReview, importProductsCSV };
