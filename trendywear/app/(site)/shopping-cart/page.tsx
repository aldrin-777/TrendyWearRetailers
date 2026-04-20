"use client"

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { 
  MdAdd, 
  MdEdit,
  MdRemove,
  MdDeleteOutline, 
  MdFavoriteBorder, 
  MdFavorite,
  MdCheck
} from 'react-icons/md';
import Breadcrumb from "@/app/(site)/components/Breadcrumb";
import TopModal from "../components/TopModal";
import { fetchShoppingCart } from '../lib/fetchShoppingCart';
import { useCart, CartItem } from '../context/CartContext';
import { addToCart } from '@/app/actions/user/AddToCart';
import { removeFromCart } from '@/app/actions/user/RemoveFromCart';
import { createCheckout } from '@/app/actions/payrex/createCheckout';
import { availVoucher } from '@/app/actions/user/AvailVoucher';

export default function ShoppingCart() {
  const CURRENCY = "PHP";
  const SHIPPING_FEE_VALUE: number = 0; 
  //const DISCOUNT_VALUE = 0;
  const ESTIMATED_DELIVERY = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const ASPECT_RATIO = "aspect-[6/7]";

  // Options for the "Edit" functionality
  const SIZE_OPTIONS = ['XS','S', 'M', 'L', 'XL'];
  const COLOR_OPTIONS = ['Yellow', 'Blue', 'Black', 'White'];

  const { cartItems, setCartItems } = useCart();

  useEffect(() => {
    fetchShoppingCart()
      .then(setCartItems)
      .catch(err => console.error(err));
}, []);

  // --- LOCAL UI STATES & VOUCHER DISCOUNT ---
  const [modalType, setModalType] = useState<"success" | "error">("success");
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [DISCOUNT_VALUE, setDISCOUNT_VALUE] = useState(0);

  // --- DERIVED CALCULATIONS ---
  const subtotal = useMemo(() =>    
    cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0), 
  [cartItems]);

  const totalFee = subtotal + SHIPPING_FEE_VALUE - DISCOUNT_VALUE;

  // --- HANDLERS ---
  const updateQuantity = (id: number, delta: number) => {
    setCartItems(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    ));
  };

  const toggleFavorite = (id: number) => {
    setCartItems(prev => prev.map(item =>
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    ));
  };

  const toggleEditMode = (id: number) => {
    setCartItems(prev => prev.map(item =>
      item.id === id ? { ...item, isEditing: !item.isEditing } : item
    ));
  };

  const updateItemOption = (id: number, field: 'size' | 'color', value: string) => {
    setCartItems(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeItem = (id: number) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const applyVoucher = async () => {
    const result = await availVoucher(voucherCode, subtotal);
    if (result?.success) {
      setModalType("success");

      if (result.discount){
        setVoucherDiscount(result.discount);

        const discountAmount = subtotal * result.discount;
        setDISCOUNT_VALUE(discountAmount);
      }
      
      setModalMessage(result.message);
      setShowModal(true);
    } else {
      setModalType("error");
      setModalMessage(result?.message ?? "Failed to apply voucher");
      setShowModal(true);
    }
  };

  const proceedToCheckout = async () =>{
    const checkoutUrl = await createCheckout(
      cartItems.map(item=>{
        return {
          name: item.name,
          amount: Math.round(item.price * 100 * (1-voucherDiscount)), // Convert to cents
          quantity: item.quantity,
          description: `Size: ${item.size}, Color: ${item.color}`
          //image: item.image + "?format=jpg"
        };
      })
    )

    if(checkoutUrl){
      window.location.href = checkoutUrl; 
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col items-center">
      <div className="w-full max-w-7xl px-6 py-10">
        
        {/* HEADER SECTION */}
        <div className="mb-6">
          {showModal && (
            <TopModal message={modalMessage} type={modalType} onClose={() => setShowModal(false)} />
          )}
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "Shopping Cart" },
            ]}
          />
          <h1 className="text-4xl font-bold text-[#C1121F] mt-2">Cart</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-10 items-start">
          
          {/* LEFT COLUMN: ITEM LIST */}
          <div className="flex-grow bg-[#E5E4E4]/60 rounded-[10px] p-8 shadow-sm h-auto transition-all duration-500 ease-in-out">
            <div className="flex flex-col">
              {cartItems.length > 0 ? (
                cartItems.map((item) => {
                  const itemTotal = item.price * item.quantity;
                  
                  return (
                    <div 
                      key={item.id} 
                      className="border-b border-gray-300 pb-8 mb-8 last:border-0 last:pb-0 last:mb-0 transition-opacity duration-300"
                    >
                      <div className="flex gap-8 relative">
                        
                        {/* Left: Image & Stepper */}
                        <div className="flex flex-col items-center gap-4">
                          <div className={`relative w-40 ${ASPECT_RATIO} bg-white rounded-[10px] border border-gray-400 overflow-hidden`}>
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-[10px]" />
                            <button 
                              onClick={() => toggleFavorite(item.id)}
                              className={`
                                absolute top-3 right-3 p-2 rounded-full shadow-md transition-all active:scale-90
                                ${item.isFavorite ? 'bg-[#C1121F] text-white' : 'bg-white text-gray-400'}
                              `}
                            >
                              {item.isFavorite ? <MdFavorite size={18} /> : <MdFavoriteBorder size={18} />}
                            </button>
                          </div>
                        
                          {/* Stepper */}
                          <div className="flex items-center gap-5">
                            <button 
                              onClick={() => {updateQuantity(item.id, -1);addToCart(item.item_id, -1, item.size, item.color);}} 
                              className="w-7 h-7 flex items-center justify-center rounded-full bg-white shadow-md text-[#C1121F] hover:bg-gray-50 transition-colors"
                            >
                              <MdRemove size={18} />
                            </button>
                            <span className="font-bold text-[#C1121F] text-lg select-none">{item.quantity}</span>
                            <button 
                              onClick={() => {updateQuantity(item.id, 1);addToCart(item.item_id, 1, item.size, item.color);}} 
                              className="w-7 h-7 flex items-center justify-center rounded-full bg-white shadow-md text-[#C1121F] hover:bg-gray-50 transition-colors"
                            >
                              <MdAdd size={18} />
                            </button>
                          </div>
                        </div>

                        {/* Right: Info & Actions */}
                        <div className="flex flex-col flex-grow py-2">
                          <h3 className="text-3xl font-bold text-[#003049] tracking-tight">{item.name}</h3>
                          <p className="text-gray-500 font-medium mt-1">{item.category}</p>
                          
                          {/* SIZE & COLOR SECTION (Switchable to Selectors in Edit Mode) */}
                          <div className="mt-4 text-sm font-bold flex flex-wrap gap-3 items-center">
                            {item.isEditing ? (
                              <>
                                <select 
                                  value={item.size} 
                                  onChange={(e) => updateItemOption(item.id, 'size', e.target.value)}
                                  className="bg-white border border-gray-300 rounded px-2 py-1 text-[#003049] outline-none"
                                >
                                  {SIZE_OPTIONS.map(s => <option key={s} value={s}>Size {s}</option>)}
                                </select>
                                <select 
                                  value={item.color} 
                                  onChange={(e) => updateItemOption(item.id, 'color', e.target.value)}
                                  className="bg-white border border-gray-300 rounded px-2 py-1 text-[#003049] outline-none"
                                >
                                  {COLOR_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                              </>
                            ) : (
                              <>
                                <span className="text-gray-400">Size <span className="text-[#003049]">{item.size}</span></span>
                                <span className="text-gray-300 px-1">/</span>
                                <span className="text-gray-400">Color <span className="text-[#003049]">{item.color}</span></span>
                              </>
                            )}
                          </div>

                          <div className="mt-6 flex items-baseline gap-3">
                            <span className="text-2xl font-bold text-[#003049]">
                              {CURRENCY} {itemTotal.toFixed(2)}
                            </span>
                          </div>

                          {/* ROW ACTIONS */}
                          <div className="mt-auto flex justify-end items-center gap-3">
                            <button 
                              onClick={() => toggleEditMode(item.id)}
                              className={`p-1 rounded transition-colors ${item.isEditing ? 'text-green-600' : 'text-[#003049]'}`}
                              title={item.isEditing ? "Save" : "Edit"}
                            >
                              {item.isEditing ? <MdCheck size={28} /> : <MdEdit size={26} />}
                            </button>
                            <div className="w-[2px] h-6 bg-gray-400 mx-1"></div>
                            <button 
                              onClick={() => {removeItem(item.id);removeFromCart(item.id);}} 
                              className="text-[#003049] hover:text-red-600 transition-colors"
                            >
                              <MdDeleteOutline size={28} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-24 transition-all duration-500">
                  <p className="text-gray-400 text-2xl font-bold uppercase tracking-[0.3em]">Empty Cart</p>
                  <Link href="/products-page" className="mt-4 text-[#C1121F] font-bold underline">
                    Continue Shopping
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: SUMMARY */}
          <div className="w-full lg:w-[420px] space-y-8">
            <div className="bg-[#E5E4E4] rounded-[10px] px-8 py-10 shadow-sm">
              <h2 className="text-3xl font-bold text-[#003049] mb-8">Order Summary</h2>
              <div className="space-y-5 font-bold text-[#003049]">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Sub Total</span>
                  <span className="text-[#C1121F]">{CURRENCY} {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Discount</span>
                  <span className="text-[#C1121F]">{CURRENCY} {DISCOUNT_VALUE.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Shipping Fee</span>
                  <span className="text-[#C1121F]">
                    {SHIPPING_FEE_VALUE === 0 ? "Free" : `${CURRENCY} ${SHIPPING_FEE_VALUE.toFixed(2)}`}
                  </span>
                </div>
                <div className="pt-6 mt-2 border-t border-gray-400 flex justify-between items-center">
                  <span className="text-xl">Total Fee</span>
                  <span className="text-2xl text-[#C1121F]">{CURRENCY} {totalFee.toFixed(2)}</span>
                </div>
              </div>

              <button 
                onClick={()=>{proceedToCheckout()}}
                disabled={cartItems.length === 0}
                className="w-full mt-6 bg-[#003049] text-white py-4 rounded-full font-bold text-lg hover:bg-[#00263d] transition-all active:scale-[0.98] disabled:bg-gray-400"
              >
                Proceed To Checkout
              </button>
              <p className="text-center mt-8 text-gray-500 text-sm font-bold">
                Estimated Delivery By <span className="text-[#003049]">{ESTIMATED_DELIVERY}</span>
              </p>
            </div>

            {/* Voucher Section */}
            <div className="bg-[#E5E4E4] rounded-[10px] p-6 shadow-sm text-center">
              <h3 className="text-2xl font-bold text-[#003049] mb-4">Have a voucher?</h3>
              <div className="flex bg-white rounded-[10px] p-2 border border-gray-100">
                <input 
                  type="text" 
                  placeholder="Voucher Code" 
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  className="bg-transparent flex-grow px-5 outline-none text-[#003049] font-bold placeholder:text-gray-300"
                />
                <button className="text-[#C1121F] font-bold px-6 py-2 hover:bg-gray-50 rounded-[10px] transition-all"
                  onClick={applyVoucher}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}