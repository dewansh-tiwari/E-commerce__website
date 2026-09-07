import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  Package, 
  AlertTriangle, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Filter,
  BarChart3,
  ShieldCheck,
  Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { adminService, productService } from '../services/api';

export const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'products', 'orders', 'users'
  const [dashboardData, setDashboardData] = useState(null);
  const [productsList, setProductsList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Product Modal
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newProd, setNewProd] = useState({
    name: '',
    brand: 'FreshFarm',
    category: 'Fruits & Vegetables',
    price: 45,
    originalPrice: 60,
    stock: 50,
    weight: '500 g',
    images: ['https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80'],
    description: 'Fresh organic high-quality grocery item.'
  });

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [dashRes, prodRes, ordRes, usrRes] = await Promise.all([
        adminService.getDashboard(),
        productService.getProducts({ limit: 100 }),
        adminService.getOrders(),
        adminService.getUsers()
      ]);

      setDashboardData(dashRes.data);
      setProductsList(prodRes.data.products);
      setOrdersList(ordRes.data);
      setUsersList(usrRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchAdminData();
  }, [user]);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      await adminService.createProduct(newProd);
      setIsAddProductOpen(false);
      fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Delete this product permanently?')) {
      await adminService.deleteProduct(id);
      fetchAdminData();
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    await adminService.updateOrderStatus(orderId, { status: newStatus });
    fetchAdminData();
  };

  const handleToggleUserBlock = async (userId, currentStatus) => {
    const targetStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
    await adminService.updateUserStatus(userId, { status: targetStatus });
    fetchAdminData();
  };

  if (loading) {
    return <div className="h-96 skeleton-shimmer rounded-3xl my-8" />;
  }

  return (
    <div className="py-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Admin Title Header */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-teal-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex items-center justify-between">
        <div>
          <span className="bg-amber-400 text-gray-950 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
            ADMIN PORTAL
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-2">Big Market 👌 Management Console</h1>
          <p className="text-xs text-gray-300">Live store metrics, product CRUD, inventory, order updates & customers</p>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar bg-white p-2 rounded-2xl border border-gray-100 shadow-2xs">
        {[
          { id: 'overview', label: '📊 Overview & Analytics' },
          { id: 'products', label: '🛒 Product Inventory' },
          { id: 'orders', label: '📦 Orders & Fulfillment' },
          { id: 'users', label: '👥 Customer Directory' }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition ${
              activeTab === t.id ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Executive Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-1">
              <span className="text-xs font-bold text-gray-400 block">Total Sales Revenue</span>
              <p className="text-2xl font-black text-emerald-700">₹{dashboardData?.revenue || 177400}</p>
              <span className="text-[10px] font-bold text-emerald-600">▲ +14% vs last week</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-1">
              <span className="text-xs font-bold text-gray-400 block">Total Orders</span>
              <p className="text-2xl font-black text-gray-900">{dashboardData?.totalOrders || 422}</p>
              <span className="text-[10px] font-bold text-amber-600">{dashboardData?.pendingOrders || 12} Pending</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-1">
              <span className="text-xs font-bold text-gray-400 block">Active Customers</span>
              <p className="text-2xl font-black text-gray-900">{dashboardData?.totalCustomers || 158}</p>
              <span className="text-[10px] font-bold text-emerald-600">Registered users</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-1">
              <span className="text-xs font-bold text-gray-400 block">Low Stock Alert</span>
              <p className="text-2xl font-black text-red-600">{dashboardData?.lowStockProducts?.length || 3}</p>
              <span className="text-[10px] font-bold text-red-500">Stock ≤ 10 units</span>
            </div>

          </div>

          {/* Visual Sales Chart Simulation */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <span>Weekly Revenue Performance</span>
            </h3>

            <div className="h-44 flex items-end gap-4 pt-6 pb-2 px-4 border-b border-gray-100">
              {dashboardData?.salesChartData?.map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-[10px] font-bold text-emerald-700 opacity-0 group-hover:opacity-100 transition">₹{item.revenue}</span>
                  <div
                    className="w-full bg-emerald-600 hover:bg-emerald-500 rounded-t-xl transition-all duration-500"
                    style={{ height: `${(item.revenue / 40000) * 100}%` }}
                  />
                  <span className="text-xs font-bold text-gray-500">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Products CRUD */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-gray-900">Grocery Inventory ({productsList.length})</h2>
            <button
              onClick={() => setIsAddProductOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 overflow-x-auto shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-[11px] font-extrabold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="p-4">Item</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">MRP</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-800">
                {productsList.map(prod => (
                  <tr key={prod._id} className="hover:bg-gray-50/80">
                    <td className="p-4 flex items-center gap-3">
                      <img src={prod.images?.[0]} alt={prod.name} className="w-10 h-10 object-cover rounded-xl border border-gray-100" />
                      <div>
                        <p className="font-bold text-gray-900">{prod.name}</p>
                        <p className="text-[10px] text-gray-400">{prod.brand} • {prod.weight}</p>
                      </div>
                    </td>
                    <td className="p-4"><span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-[10px] font-bold">{prod.category}</span></td>
                    <td className="p-4 font-bold text-emerald-700">₹{prod.price}</td>
                    <td className="p-4 text-gray-400 line-through">₹{prod.originalPrice}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        prod.stock <= 5 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {prod.stock} Units
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleDeleteProduct(prod._id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Orders Management */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <h2 className="text-base font-extrabold text-gray-900">All Customer Orders ({ordersList.length})</h2>

          <div className="space-y-3">
            {ordersList.map(ord => (
              <div key={ord._id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100 text-xs">
                  <div>
                    <span className="font-extrabold text-emerald-700">#{ord.orderId}</span>
                    <span className="text-gray-500 ml-2">Customer: {ord.user?.name || 'Rahul Sharma'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-400">Change Status:</span>
                    <select
                      value={ord.orderStatus}
                      onChange={(e) => handleUpdateOrderStatus(ord._id, e.target.value)}
                      className="bg-emerald-50 text-emerald-900 font-extrabold text-xs p-1.5 rounded-xl border border-emerald-200"
                    >
                      <option value="Order Placed">Order Placed</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Preparing">Preparing</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">{ord.items?.length} items • Paid via {ord.paymentMethod?.toUpperCase()}</span>
                  <span className="font-extrabold text-gray-900 text-sm">₹{ord.totalAmount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Customer Directory */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-4 shadow-sm">
          <h2 className="text-base font-extrabold text-gray-900">Customer Accounts ({usersList.length})</h2>
          
          <div className="divide-y divide-gray-100">
            {usersList.map(u => (
              <div key={u._id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <p className="font-extrabold text-gray-900">{u.name}</p>
                  <p className="text-gray-500">{u.email} • {u.phone || 'No phone'}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-amber-700 font-bold">🪙 {u.coins} Coins</span>
                  <button
                    onClick={() => handleToggleUserBlock(u._id, u.status)}
                    className={`font-bold px-3 py-1 rounded-xl text-[10px] ${
                      u.status === 'blocked' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {u.status === 'blocked' ? 'Unblock' : 'Block Account'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {isAddProductOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 relative">
            <button onClick={() => setIsAddProductOpen(false)} className="absolute top-4 right-4 text-gray-400"><X className="w-5 h-5" /></button>
            <h3 className="text-base font-extrabold text-gray-900">Add New Grocery Item</h3>
            
            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div><label className="font-bold block mb-1">Product Title</label><input type="text" required value={newProd.name} onChange={(e) => setNewProd({...newProd, name: e.target.value})} className="w-full p-2 bg-gray-50 rounded-xl border border-gray-200" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="font-bold block mb-1">Selling Price (₹)</label><input type="number" required value={newProd.price} onChange={(e) => setNewProd({...newProd, price: Number(e.target.value)})} className="w-full p-2 bg-gray-50 rounded-xl border border-gray-200" /></div>
                <div><label className="font-bold block mb-1">MRP (₹)</label><input type="number" required value={newProd.originalPrice} onChange={(e) => setNewProd({...newProd, originalPrice: Number(e.target.value)})} className="w-full p-2 bg-gray-50 rounded-xl border border-gray-200" /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="font-bold block mb-1">Stock Units</label><input type="number" required value={newProd.stock} onChange={(e) => setNewProd({...newProd, stock: Number(e.target.value)})} className="w-full p-2 bg-gray-50 rounded-xl border border-gray-200" /></div>
                <div><label className="font-bold block mb-1">Weight / Vol</label><input type="text" required value={newProd.weight} onChange={(e) => setNewProd({...newProd, weight: e.target.value})} className="w-full p-2 bg-gray-50 rounded-xl border border-gray-200" /></div>
              </div>
              <button type="submit" className="w-full bg-emerald-600 text-white font-extrabold py-3 rounded-xl">Save & Publish Product</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
