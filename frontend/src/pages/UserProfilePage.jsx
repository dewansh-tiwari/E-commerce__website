import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Package, MapPin, Heart, Coins, Bell, LogOut, ShieldCheck, ChevronRight, Truck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { orderService, userService } from '../services/api';

export const UserProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout, setUser, setIsAuthModalOpen } = useAuth();

  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'addresses', 'notifications', 'profile'
  const [myOrders, setMyOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Profile Edit
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileMsg, setProfileMsg] = useState('');

  useEffect(() => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    const fetchData = async () => {
      try {
        setLoadingOrders(true);
        const [ordersRes, notifRes] = await Promise.all([
          orderService.getMyOrders(),
          userService.getNotifications()
        ]);
        setMyOrders(ordersRes.data);
        setNotifications(notifRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchData();
  }, [user]);

  if (!user) return null;

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await userService.updateProfile({ name, phone });
      setUser(res.data);
      setProfileMsg('Profile updated successfully!');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="py-8 max-w-5xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center font-black text-xl text-amber-300 border border-white/20">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black">{user.name}</h1>
            <p className="text-xs text-emerald-200">{user.email} • {user.phone || 'Add phone number'}</p>
            <span className="inline-block mt-1 bg-amber-400 text-gray-950 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase">
              🪙 {user.coins} SuperCoins Balance
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="hidden sm:flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2 rounded-xl transition border border-white/20"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Tabs Nav */}
        <div className="lg:col-span-4 bg-white p-3 rounded-3xl border border-gray-100 shadow-sm space-y-1">
          {[
            { id: 'orders', label: 'My Orders', icon: Package },
            { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'profile', label: 'Account Details', icon: User }
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-extrabold transition ${
                  isActive ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{t.label}</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-70" />
              </button>
            );
          })}
        </div>

        {/* Right Tab Content */}
        <div className="lg:col-span-8">
          
          {/* TAB 1: My Orders */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h2 className="text-base font-extrabold text-gray-900">Order History ({myOrders.length})</h2>

              {loadingOrders ? (
                <div className="h-40 skeleton-shimmer rounded-2xl" />
              ) : myOrders.length === 0 ? (
                <div className="bg-white p-8 rounded-3xl border border-gray-100 text-center">
                  <Package className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-800">No orders placed yet</p>
                  <button onClick={() => navigate('/products')} className="mt-3 bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl">
                    Shop Groceries
                  </button>
                </div>
              ) : (
                myOrders.map((ord) => (
                  <div key={ord._id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100 text-xs">
                      <div>
                        <span className="font-extrabold text-emerald-700">#{ord.orderId}</span>
                        <span className="text-gray-400 ml-2">{new Date(ord.createdAt).toLocaleDateString()}</span>
                      </div>
                      <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase">
                        {ord.orderStatus}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      {ord.items?.map((item, i) => (
                        <div key={i} className="flex justify-between text-gray-700">
                          <span>{item.name} ({item.weight}) x {item.quantity}</span>
                          <span className="font-bold text-gray-900">₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs font-black text-gray-900">Total: ₹{ord.totalAmount}</span>
                      <button
                        onClick={() => navigate(`/orders/track?orderId=${ord.orderId}`)}
                        className="bg-emerald-50 text-emerald-700 font-bold text-xs px-3.5 py-1.5 rounded-xl border border-emerald-200 hover:bg-emerald-100 flex items-center gap-1"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Track Order</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: Saved Addresses */}
          {activeTab === 'addresses' && (
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <h2 className="text-base font-extrabold text-gray-900">Saved Shipping Addresses</h2>
              <div className="space-y-3">
                {user.addresses?.map((addr, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border border-gray-200 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-emerald-900">
                      <span>{addr.title}</span>
                      {addr.isDefault && <span className="text-[10px] bg-emerald-100 px-2 py-0.5 rounded">Default</span>}
                    </div>
                    <p className="font-semibold text-gray-800">{addr.name}</p>
                    <p className="text-gray-600">{addr.street}, {addr.apartment}, {addr.city} - {addr.zipCode}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Notifications */}
          {activeTab === 'notifications' && (
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-3">
              <h2 className="text-base font-extrabold text-gray-900">Notifications Log</h2>
              <div className="space-y-2">
                {notifications.map((n, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-2xl text-xs space-y-0.5">
                    <p className="font-bold text-gray-900">{n.title}</p>
                    <p className="text-gray-600">{n.message}</p>
                    <span className="text-[10px] text-gray-400">{new Date(n.createdAt).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Profile Details */}
          {activeTab === 'profile' && (
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <h2 className="text-base font-extrabold text-gray-900">Edit Account Info</h2>
              {profileMsg && <p className="text-xs font-bold text-emerald-600">{profileMsg}</p>}

              <form onSubmit={handleUpdateProfile} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gray-50 text-xs font-semibold p-2.5 rounded-xl border border-gray-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Mobile Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-gray-50 text-xs font-semibold p-2.5 rounded-xl border border-gray-200"
                  />
                </div>
                <button type="submit" className="bg-emerald-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl">
                  Save Changes
                </button>
              </form>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
