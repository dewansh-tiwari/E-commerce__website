import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Truck, CheckCircle2, Clock, MapPin, Phone, ArrowLeft, ShieldCheck } from 'lucide-react';
import { orderService } from '../services/api';

export const OrderTrackingPage = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStepIndex, setCurrentStepIndex] = useState(3); // 'Out for Delivery' default demo

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        if (orderId) {
          const res = await orderService.getOrderById(orderId);
          setOrder(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  const steps = [
    { label: 'Order Placed', time: '10:02 AM', desc: 'Received by store system' },
    { label: 'Order Confirmed', time: '10:03 AM', desc: 'Verified by Store Manager' },
    { label: 'Preparing', time: '10:06 AM', desc: 'Items sanitized & packed in bag' },
    { label: 'Out for Delivery', time: '10:12 AM', desc: 'Driver Ramesh is on the way' },
    { label: 'Delivered', time: '10:25 AM', desc: 'Arrived at your door' }
  ];

  return (
    <div className="py-8 max-w-3xl mx-auto space-y-6">
      
      <div className="flex items-center gap-3">
        <Link to="/profile" className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200 text-gray-700">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900">Live Order Tracking</h1>
          <p className="text-xs text-gray-500">Order #{orderId || 'ORD102938'}</p>
        </div>
      </div>

      {/* Main Delivery Status Card */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-amber-300">
              <Truck className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-bold bg-amber-400 text-gray-950 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                EXPRESS 15-MIN
              </span>
              <h3 className="text-lg font-extrabold mt-1">Out for Delivery</h3>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-emerald-200 block font-semibold">Estimated Arrival</span>
            <span className="text-xl font-black text-amber-300">18 - 22 Mins</span>
          </div>
        </div>

        {/* Step Timeline Progress Bar */}
        <div className="grid grid-cols-5 gap-2 pt-2">
          {steps.map((step, idx) => {
            const isDone = idx <= currentStepIndex;
            return (
              <div key={idx} className="space-y-2 text-center">
                <div className={`h-2 rounded-full transition-all ${
                  isDone ? 'bg-amber-400' : 'bg-white/20'
                }`} />
                <span className={`text-[10px] font-bold block truncate ${
                  isDone ? 'text-white' : 'text-gray-400'
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

      </div>

      {/* Vertical Timeline & Delivery Driver */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Timeline Details */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <h3 className="text-sm font-extrabold text-gray-900 border-b border-gray-100 pb-3">Delivery Timeline</h3>
          
          <div className="space-y-6 relative pl-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
            {steps.map((step, idx) => {
              const isDone = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div key={idx} className="relative">
                  <div className={`absolute -left-6 top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isDone ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                  </div>

                  <div className="pl-3">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-xs font-extrabold ${isCurrent ? 'text-emerald-700' : isDone ? 'text-gray-900' : 'text-gray-400'}`}>
                        {step.label}
                      </h4>
                      <span className="text-[10px] text-gray-400 font-semibold">{step.time}</span>
                    </div>
                    <p className="text-[11px] text-gray-500">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Delivery Driver Info & Address */}
        <div className="space-y-6">
          
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-gray-900 border-b border-gray-100 pb-3">Delivery Partner</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-extrabold flex items-center justify-center text-sm shadow">
                  RK
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Ramesh Kumar</h4>
                  <p className="text-[11px] text-gray-500">Valet ID: #VK904 • MH 02 EV 4092</p>
                  <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded">
                    ⭐ 4.9 Rating (1,240 Deliveries)
                  </span>
                </div>
              </div>

              <a
                href="tel:+919876543210"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call</span>
              </a>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-2 text-xs">
            <h3 className="font-extrabold text-gray-900 flex items-center gap-1.5 text-sm border-b border-gray-100 pb-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Destination Address</span>
            </h3>
            <p className="font-bold text-gray-800">Rahul Sharma</p>
            <p className="text-gray-600">Flat 402, Green Meadows, Link Road, Bandra West, Mumbai 400050</p>
            <p className="text-gray-400">📞 +91 98123 45678</p>
          </div>

        </div>

      </div>

    </div>
  );
};
