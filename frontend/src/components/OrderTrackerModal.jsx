import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Clock, Phone, MapPin, Truck, Package, ShieldCheck } from 'lucide-react';

export const OrderTrackerModal = ({ order, isOpen, onClose }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(2); // Default 'Preparing'

  useEffect(() => {
    if (!order) return;
    const statusMap = {
      'Order Placed': 0,
      'Confirmed': 1,
      'Preparing': 2,
      'Out for Delivery': 3,
      'Delivered': 4
    };
    setCurrentStepIndex(statusMap[order.orderStatus] ?? 2);
  }, [order]);

  if (!isOpen || !order) return null;

  const steps = [
    { label: 'Order Placed', desc: 'Received by store system' },
    { label: 'Confirmed', desc: 'Verified & packed by store' },
    { label: 'Preparing', desc: 'Items being sanitized & bagged' },
    { label: 'Out for Delivery', desc: 'Driver Ramesh is on the way' },
    { label: 'Delivered', desc: 'Arrived at your door' }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Order Header */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Live Order Status</span>
            <h3 className="text-lg font-extrabold text-gray-900">Order #{order.orderId}</h3>
            <p className="text-xs text-gray-500">Est. Delivery: {order.estimatedDeliveryTime || '20-30 Mins'}</p>
          </div>
        </div>

        {/* Vertical Timeline */}
        <div className="space-y-6 relative pl-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
          {steps.map((step, idx) => {
            const isDone = idx <= currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div key={idx} className="relative flex items-start gap-4">
                
                {/* Step Circle */}
                <div className={`absolute -left-6 top-0 w-6.5 h-6.5 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isDone 
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-100' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                </div>

                <div className="pl-3">
                  <h4 className={`text-sm font-extrabold ${isCurrent ? 'text-emerald-700' : isDone ? 'text-gray-900' : 'text-gray-400'}`}>
                    {step.label}
                    {isCurrent && <span className="ml-2 text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full animate-pulse">In Progress</span>}
                  </h4>
                  <p className="text-xs text-gray-500">{step.desc}</p>
                </div>

              </div>
            );
          })}
        </div>

        {/* Delivery Partner Details */}
        <div className="mt-6 pt-4 border-t border-gray-100 bg-emerald-50/60 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-extrabold flex items-center justify-center text-xs">
              RK
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">{order.driverInfo?.name || 'Ramesh Kumar'}</p>
              <p className="text-[11px] text-gray-500">Delivery Valet • {order.driverInfo?.vehicleNumber || 'MH 02 EV 4092'}</p>
            </div>
          </div>

          <a
            href={`tel:${order.driverInfo?.phone || '+919876543210'}`}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-xs transition"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call</span>
          </a>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs py-3 rounded-xl transition"
        >
          Close Tracking
        </button>

      </div>
    </div>
  );
};
