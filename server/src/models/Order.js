const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    orderItems: [
      {
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        image: { type: String },
        price: { type: Number, required: true },
        product: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'Product',
        },
      },
    ],
    shippingAddress: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      region: { type: String },
      ward: { type: String },
      landmark: { type: String },
      postalCode: { type: String },
      country: { type: String, required: true },
      phone: { type: String, required: true },
    },
    deliveryType: {
      type: String,
      enum: ['Standard', 'Express'],
      default: 'Standard',
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    paymentResult: {
      id: { type: String },
      status: { type: String },
      update_time: { type: String },
      email_address: { type: String },
    },
    itemsPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    status: {
      type: String,
      enum: ['Pending', 'Placed', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'],
      default: 'Pending',
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    confirmedAt: {
      type: Date,
    },
    processingAt: {
      type: Date,
    },
    shippedAt: {
      type: Date,
    },
    outForDeliveryAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
    },
    vendorOrders: [
      {
        vendor: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'User',
        },
        items: [
          {
            name: { type: String, required: true },
            qty: { type: Number, required: true },
            image: { type: String },
            price: { type: Number, required: true },
            product: {
              type: mongoose.Schema.Types.ObjectId,
              required: true,
              ref: 'Product',
            },
          }
        ],
        shippingPrice: { type: Number, default: 0.0 },
        discountAmount: { type: Number, default: 0.0 },
        couponCode: { type: String },
        isDelivered: { type: Boolean, default: false },
        deliveredAt: { type: Date },
        disputeStatus: { 
          type: String, 
          enum: ['None', 'Open', 'Resolved_Refunded', 'Rejected'], 
          default: 'None' 
        },
        disputeReason: { type: String },
        disputedAt: { type: Date },
      }
    ],
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
