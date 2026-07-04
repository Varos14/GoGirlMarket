const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    Get analytics and sales data for a vendor
// @route   GET /api/vendors/analytics
// @access  Private/Vendor
const getVendorAnalytics = async (req, res) => {
  try {
    const vendorIdStr = req.user._id.toString();

    // 1. Get all orders containing items from this vendor
    const orders = await Order.find({ 'vendorOrders.vendor': req.user._id });

    let totalRevenue = 0;
    let totalOrdersCount = orders.length;
    let productsSoldMap = {};
    
    // Process the data to generate charts/stats
    // We group revenue by Date for the chart
    let revenueByDateMap = {};

    orders.forEach(order => {
      // Only process the specific sub-order for THIS vendor
      const vendorOrder = order.vendorOrders.find(vo => vo.vendor.toString() === vendorIdStr);
      
      if (vendorOrder && order.isPaid) {
        // Calculate revenue
        let orderRevenue = 0;
        
        vendorOrder.items.forEach(item => {
          orderRevenue += (item.price * item.qty);
          
          // Track product sales
          if (productsSoldMap[item.name]) {
            productsSoldMap[item.name] += item.qty;
          } else {
            productsSoldMap[item.name] = item.qty;
          }
        });
        
        totalRevenue += orderRevenue;

        // Group by Date for Chart (e.g. "YYYY-MM-DD")
        const dateKey = order.createdAt.toISOString().split('T')[0];
        if (revenueByDateMap[dateKey]) {
          revenueByDateMap[dateKey] += orderRevenue;
        } else {
          revenueByDateMap[dateKey] = orderRevenue;
        }
      }
    });

    // Format revenue data for Recharts: [{ date: '2023-10-01', revenue: 50000 }]
    // Sort by date ascending
    const revenueData = Object.keys(revenueByDateMap)
      .sort()
      .map(date => ({
        date,
        revenue: revenueByDateMap[date]
      }));

    // Format top products: [{ name: 'Lipstick', qty: 5 }]
    // Sort by qty descending and take top 5
    const topProducts = Object.keys(productsSoldMap)
      .map(name => ({
        name,
        qty: productsSoldMap[name]
      }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    // Calculate total products listed by this vendor
    const totalProductsCount = await Product.countDocuments({ vendor: req.user._id });

    res.json({
      totalRevenue,
      totalOrders: totalOrdersCount,
      totalProducts: totalProductsCount,
      revenueData,
      topProducts
    });

  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  getVendorAnalytics
};
