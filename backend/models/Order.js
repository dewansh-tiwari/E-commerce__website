import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  brand: { type: String, default: '' },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  weight: { type: String, default: '' },
  size: { type: String, default: '' },
  selectedSize: { type: String, default: '' },
  image: { type: String, default: '' }
});

const timelineSchema = new mongoose.Schema({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  note: { type: String, default: '' }
});

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  shippingAddress: {
    title: String,
    name: String,
    phone: String,
    street: String,
    apartment: String,
    city: String,
    state: String,
    zipCode: String
  },
  deliverySlot: {
    type: { type: String, enum: ['express', 'standard', 'scheduled'], default: 'express' },
    timeSlot: { type: String, default: '15-25 Minutes' }
  },
  paymentMethod: { type: String, enum: ['upi', 'card', 'netbanking', 'wallet', 'cod'], required: true },
  paymentStatus: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
  orderStatus: {
    type: String,
    enum: ['Order Placed', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'],
    default: 'Order Placed'
  },
  timeline: [timelineSchema],
  subtotal: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  shopkeeperDiscount: { type: Number, default: 0 },
  deliveryFee: { type: Number, default: 0 },
  taxes: { type: Number, default: 0 },
  coinsRedeemed: { type: Number, default: 0 },
  coinsDiscount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  estimatedDeliveryTime: { type: String, default: '20-30 minutes' },
  driverInfo: {
    name: { type: String, default: 'Ramesh Kumar' },
    phone: { type: String, default: '+91 98765 43210' },
    vehicleNumber: { type: String, default: 'MH 02 EV 4092' }
  }
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);
