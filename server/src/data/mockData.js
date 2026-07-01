const users = [
  {
    name: 'Admin User',
    email: 'admin@gogirl.com',
    password: 'password123',
    role: 'admin',
  },
  {
    name: 'Jane Boutique',
    email: 'vendor@gogirl.com',
    password: 'password123',
    role: 'vendor',
    storeName: 'Janes Beauty',
  },
  {
    name: 'Regular Customer',
    email: 'customer@gogirl.com',
    password: 'password123',
    role: 'customer',
  },
];

const products = [
  {
    name: 'Elegant Evening Dress',
    description: 'A beautiful evening dress perfect for special occasions. Made with high-quality silk.',
    category: 'Fashion',
    brand: 'Zuri Styles',
    price: 85000,
    countInStock: 15,
    images: ['https://via.placeholder.com/800x800.png?text=Evening+Dress'],
    rating: 4.5,
    numReviews: 12,
  },
  {
    name: 'Hydrating Face Serum',
    description: 'Vitamin C enriched face serum for glowing skin.',
    category: 'Skincare',
    brand: 'Naturals',
    price: 45000,
    countInStock: 50,
    images: ['https://via.placeholder.com/800x800.png?text=Face+Serum'],
    rating: 4.8,
    numReviews: 24,
  },
  {
    name: 'Classic Leather Handbag',
    description: 'Premium leather handbag with multiple compartments.',
    category: 'Bags',
    brand: 'Luxe',
    price: 120000,
    countInStock: 5,
    images: ['https://via.placeholder.com/800x800.png?text=Leather+Handbag'],
    rating: 4.2,
    numReviews: 8,
  },
  {
    name: 'Matte Liquid Lipstick',
    description: 'Long-lasting matte liquid lipstick in bold red.',
    category: 'Beauty',
    brand: 'Glamour',
    price: 25000,
    countInStock: 100,
    images: ['https://via.placeholder.com/800x800.png?text=Matte+Lipstick'],
    rating: 4.9,
    numReviews: 56,
  },
];

module.exports = { users, products };
