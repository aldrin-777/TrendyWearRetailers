"use client"

import { useState } from 'react';
import Link from 'next/link';
import { 
  MdLocalShipping, 
  MdCheckCircle, 
  MdReplay,
  MdChevronRight
} from 'react-icons/md';
import Breadcrumb from "@/app/(site)/components/Breadcrumb";

export default function OrderHistory() {
  const CURRENCY = "PHP";
  const ASPECT_RATIO = "aspect-[6/7]"; 

  const [orders] = useState([
    {
      id: "ORD-99281",
      date: "Oct 12, 2025",
      dateShipped: "Oct 13, 2025",
      dateDelivered: "Oct 15, 2025",
      status: "Delivered",
      total: 2000.00,
      items: [
        { name: 'Flannel Polo', category: 'Button-down Collar', quantity: 1, size: 'XL', color: 'Yellow', image: '/images/placeholder.jpg' },
        { name: 'Flannel', category: 'Button-down Collar', quantity: 1, size: 'M', color: 'Blue', image: '/images/placeholder.jpg' },
      ]
    },
    {
      id: "ORD-88273",
      date: "Sept 28, 2025",
      dateShipped: "Sept 30, 2025",
      dateDelivered: null, // Still in transit
      status: "Shipped",
      total: 1000.00,
      items: [
        { name: 'Denim Jacket', category: 'Outerwear', quantity: 1, size: 'L', color: 'Black', image: '/images/placeholder.jpg' },
      ]
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered': return 'text-green-600 bg-green-50';
      case 'Shipped': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col items-center">
      <div className="w-full max-w-7xl px-4 sm:px-6 md:px-8 py-10">
        
        {/* HEADER SECTION */}
        <div className="mb-6">
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "Orders" },
            ]}
          />
          <h1 className="text-3xl sm:text-4xl font-bold text-[#C1121F] mt-2">Orders</h1>
        </div>

        {/* SINGLE COLUMN ORDERS LIST */}
        <div className="space-y-8 sm:space-y-10">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-[10px] overflow-hidden shadow-sm border border-gray-300">
              
              {/* Order Top Bar */}
              <div className="bg-[#E5E4E4]/60 px-4 sm:px-8 py-4 sm:py-6 flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-gray-300">
                
                {/* Static Order Info (Left Side) */}
                <div className="flex flex-col sm:flex-row gap-6 sm:gap-12 w-full sm:w-auto">
                  <div>
                    <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-gray-500 font-black">Order Placed</p>
                    <p className="text-lg font-bold text-[#003049]">{order.date}</p>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-gray-500 font-black">Total Amount</p>
                    <p className="text-lg font-bold text-[#C1121F]">{CURRENCY} {order.total.toFixed(2)}</p>
                  </div>
                  <div className="hidden md:block">
                    <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-gray-500 font-black">Transaction ID</p>
                    <p className="text-lg font-bold text-[#003049] uppercase">{order.id}</p>
                  </div>
                </div>
                
                {/* Logistics & Status (Right Side) */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 w-full sm:w-auto mt-4 sm:mt-0">
                  
                  {/* The Timeline Dates (Moved to the left) */}
                  <div className="flex flex-col items-start sm:items-end text-[13px] text-gray-500 font-medium">
                    {order.dateShipped && (
                      <p>Shipped: <span className="text-blue-600">{order.dateShipped}</span></p>
                    )}
                    {order.dateDelivered && (
                      <p>Delivered: <span className="text-green-600">{order.dateDelivered}</span></p>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className={`inline-flex items-center gap-2 px-3 sm:px-5 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-black uppercase tracking-widest ${getStatusColor(order.status)} border border-current/10`}>
                    {order.status === 'Delivered' ? <MdCheckCircle size={16} className="sm:text-[18px]" /> : <MdLocalShipping size={16} className="sm:text-[18px]" />}
                    {order.status}
                  </div>
                </div>    

              </div>

              {/* Items List */}
              <div className="p-4 sm:p-8">
                <div className="flex flex-col gap-6 sm:gap-10">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-start border-b border-gray-300 last:border-0 pb-6 sm:pb-10 last:pb-0">
                      
                      {/* Left: Image */}
                      <div className={`relative w-full sm:w-32 ${ASPECT_RATIO} bg-white rounded-[10px] border border-gray-400 overflow-hidden flex-shrink-0`}>
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>

                      {/* Right: Info */}
                      <div className="flex flex-col flex-grow pt-2 sm:pt-0">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full">
                          <div>
                            <h4 className="text-xl sm:text-2xl font-bold text-[#003049] tracking-tight">{item.name}</h4>
                            <p className="text-gray-500 font-medium mt-1">{item.category}</p>
                          </div>
                        </div>

                        <div className="mt-2 sm:mt-4 flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-4 text-sm sm:text-base font-bold">
                          <span className="text-gray-400">Qty <span className="text-[#003049]">{item.quantity}</span></span>
                          <span className="text-gray-300 hidden sm:inline">|</span>
                          <span className="text-gray-400">Size <span className="text-[#003049]">{item.size}</span></span>
                          <span className="text-gray-300 hidden sm:inline">|</span>
                          <span className="text-gray-400">Color <span className="text-[#003049]">{item.color}</span></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>            
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}