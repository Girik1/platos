import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag, ArrowLeft, Building2, ShieldCheck, CheckCircle2, Wallet, CreditCard, Banknote, QrCode, Clock } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import VegBadge from '../../components/common/VegBadge';
import API from '../../api/axios';
import toast from 'react-hot-toast';

export default function CartPage() {
  const navigate = useNavigate();
  const { user, updateWalletBalance } = useAuth();
  const {
    items,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartSubtotal,
    getItemUnitPrice,
    getItemTotalPrice,
  } = useCart();

  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [pickupSlot, setPickupSlot] = useState('asap');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [placing, setPlacing] = useState(false);

  // Corporate subsidy state
  const [subsidyInfo, setSubsidyInfo] = useState({
    eligible: false,
    amount: 0,
    company: null,
    mealType: null,
    loading: true,
  });

  // Fetch live employer subsidy quote
  useEffect(() => {
    let isMounted = true;
    API.get('/orders/subsidy-quote')
      .then((res) => {
        if (isMounted) {
          setSubsidyInfo({
            eligible: Boolean(res.data?.eligible),
            amount: Number(res.data?.amount) || 0,
            company: res.data?.company || user?.company,
            mealType: res.data?.mealType || null,
            loading: false,
          });
        }
      })
      .catch(() => {
        if (isMounted) {
          setSubsidyInfo((prev) => ({ ...prev, loading: false }));
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Financial Mathematics
  const subtotal = cartSubtotal;

  // Subsidy cannot exceed subtotal
  const appliedSubsidy = useMemo(() => {
    if (!subsidyInfo.eligible || subsidyInfo.amount <= 0) return 0;
    return Math.min(subsidyInfo.amount, subtotal);
  }, [subsidyInfo, subtotal]);

  // Tax calculation (5% GST inclusive breakdown)
  const gstInclusiveAmount = useMemo(() => {
    // 5% GST = (Subtotal * 5) / 105
    return (subtotal * 5) / 105;
  }, [subtotal]);

  // Final Net Payable
  const netPayable = useMemo(() => {
    return Math.max(0, subtotal - appliedSubsidy);
  }, [subtotal, appliedSubsidy]);

  const walletBalance = Number(user?.wallet_balance) || 0;
  const isWalletSufficient = walletBalance >= netPayable;

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;

    if (paymentMethod === 'wallet' && !isWalletSufficient) {
      toast.error('Insufficient wallet balance. Please choose UPI or Card.');
      return;
    }

    try {
      setPlacing(true);
      const slotLabel = {
        asap: 'ASAP (~10-15 mins)',
        lunch_a: 'Lunch 12:30 PM - 01:00 PM',
        lunch_b: 'Lunch 01:00 PM - 01:30 PM',
        lunch_c: 'Lunch 01:30 PM - 02:00 PM',
        snacks: 'Snacks 04:30 PM - 05:00 PM',
        dinner: 'Dinner 07:30 PM - 08:15 PM',
      }[pickupSlot] || pickupSlot;

      const fullInstructions = `[Slot: ${slotLabel}] ${specialInstructions}`.trim();

      const res = await API.post('/orders', {
        payment_method: paymentMethod,
        special_instructions: fullInstructions,
        items: items,
      });

      const order = res.data?.order || res.data;

      // Update wallet balance in context and state immediately
      if (paymentMethod === 'wallet') {
        const nextBal = res.data?.updated_wallet_balance !== undefined
          ? Number(res.data.updated_wallet_balance)
          : Math.max(0, walletBalance - netPayable);
        if (updateWalletBalance) {
          updateWalletBalance(nextBal);
        }
      }

      clearCart();
      toast.success('Order placed successfully! Pickup OTP generated 🎉');
      navigate(`/orders/${order.id}`);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to place order. Try again.';
      toast.error(msg);
    } finally {
      setPlacing(false);
    }
  };

  // Empty state with proper mathematical layout
  if (items.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 bg-gray-50 text-center">
        <div className="w-24 h-24 rounded-3xl bg-orange-50 text-[#FF6B35] flex items-center justify-center mb-5 shadow-sm">
          <ShoppingBag className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
          Your cafeteria tray is empty
        </h2>
        <p className="text-sm text-gray-500 max-w-sm mb-6 leading-relaxed">
          Explore today's fresh campus dishes from our live counters and place your order ahead.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-[#FF6B35] hover:bg-[#e55a28] text-white font-bold text-sm uppercase tracking-wider shadow-md shadow-orange-500/25 active:scale-95 transition-all"
        >
          <span>Browse Cafeteria Menu</span>
        </Link>
      </div>
    );
  }

  const vendorName = items[0]?.vendor_name || 'Campus Kitchen';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Menu
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (7 cols): Items & Payment */}
          <div className="lg:col-span-7 space-y-6">
            {/* Header info */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                  Checkout Tray
                </h1>
                <p className="text-xs font-medium text-gray-500 mt-0.5">
                  Counter: <span className="font-semibold text-gray-800">{vendorName}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={clearCart}
                className="text-xs font-semibold text-red-500 hover:text-red-700 hover:underline"
              >
                Clear All
              </button>
            </div>

            {/* Cart Items List */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs divide-y divide-gray-100 overflow-hidden">
              {items.map((item) => {
                const unitPrice = getItemUnitPrice(item);
                const lineTotal = getItemTotalPrice(item);

                return (
                  <div key={item.cartItemId} className="p-4 sm:p-5 flex items-start gap-4">
                    {/* Veg Badge */}
                    <div className="pt-0.5">
                      <VegBadge isVeg={item.is_veg} size="md" />
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-bold text-gray-900 leading-snug truncate">
                          {item.name}
                        </h3>
                        <span className="text-sm font-black text-gray-900 tabular-nums shrink-0">
                          ₹{lineTotal.toFixed(0)}
                        </span>
                      </div>

                      <p className="text-xs text-gray-500 mt-0.5">
                        ₹{unitPrice.toFixed(0)} each
                      </p>

                      {/* Selected Addons */}
                      {item.addons && item.addons.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {item.addons.map((ad, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-md bg-gray-50 text-gray-700 border border-gray-200"
                            >
                              +{ad.name} (₹{ad.price})
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Special Note */}
                      {item.specialInstructions && (
                        <p className="text-xs text-amber-700 bg-amber-50/70 p-2 rounded-lg mt-2 font-medium">
                          Note: "{item.specialInstructions}"
                        </p>
                      )}

                      {/* Stepper & Remove Action */}
                      <div className="flex items-center justify-between mt-3.5 pt-2 border-t border-gray-50">
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.cartItemId)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>

                        {/* Calculated Stepper */}
                        <div className="inline-flex items-center h-8 p-0.5 rounded-lg bg-gray-50 border border-gray-200 shadow-xs">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                            className="w-7 h-7 rounded-md bg-white hover:bg-gray-100 flex items-center justify-center text-gray-700 shadow-xs active:scale-90 transition-transform"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-gray-900 tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                            className="w-7 h-7 rounded-md bg-[#FF6B35] text-white hover:bg-[#e55a28] flex items-center justify-center shadow-xs active:scale-90 transition-transform"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pre-Order & Scheduled Meal Slot */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#FF6B35]" /> Pickup & Pre-Order Timing
                </label>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                  Zero Queue Wait
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'asap', label: '⚡ ASAP (~12m)', sub: 'Ready fresh now' },
                  { id: 'lunch_a', label: '🍛 12:30 - 01:00 PM', sub: 'Lunch Slot A' },
                  { id: 'lunch_b', label: '🍛 01:00 - 01:30 PM', sub: 'Lunch Slot B' },
                  { id: 'lunch_c', label: '🍛 01:30 - 02:00 PM', sub: 'Lunch Slot C' },
                  { id: 'snacks', label: '🍿 04:30 - 05:00 PM', sub: 'Tea / Snack Break' },
                  { id: 'dinner', label: '🌙 07:30 - 08:15 PM', sub: 'Evening Shift Dinner' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setPickupSlot(s.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      pickupSlot === s.id
                        ? 'border-[#FF6B35] bg-orange-50/70 text-gray-900 shadow-xs'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600 bg-white'
                    }`}
                  >
                    <p className="text-xs font-bold leading-tight">{s.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{s.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Special Preparation Instructions for Kitchen */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Special Kitchen Note
              </label>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Any dietary preferences or packaging notes for this order..."
                rows={2}
                maxLength={200}
                className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent resize-none placeholder-gray-400"
              />
            </div>

            {/* Payment Method Selector */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
                Select Payment Mode
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Company Food Wallet */}
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                    paymentMethod === 'wallet'
                      ? 'border-[#FF6B35] bg-[#FFF8F5]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="wallet"
                    checked={paymentMethod === 'wallet'}
                    onChange={() => setPaymentMethod('wallet')}
                    className="sr-only"
                  />
                  <div className="w-8 h-8 rounded-lg bg-orange-100 text-[#FF6B35] flex items-center justify-center shrink-0">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900">Food Wallet</span>
                      {paymentMethod === 'wallet' && <CheckCircle2 className="w-4 h-4 text-[#FF6B35]" />}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Balance: ₹{walletBalance.toFixed(0)}
                    </p>
                    {!isWalletSufficient && (
                      <span className="text-[10px] text-red-500 font-semibold block mt-0.5">
                        Insufficient balance
                      </span>
                    )}
                  </div>
                </label>

                {/* Instant UPI */}
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                    paymentMethod === 'upi'
                      ? 'border-[#FF6B35] bg-[#FFF8F5]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="upi"
                    checked={paymentMethod === 'upi'}
                    onChange={() => setPaymentMethod('upi')}
                    className="sr-only"
                  />
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#004E89] flex items-center justify-center shrink-0">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900">UPI / QR</span>
                      {paymentMethod === 'upi' && <CheckCircle2 className="w-4 h-4 text-[#FF6B35]" />}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Google Pay, PhonePe, Paytm
                    </p>
                  </div>
                </label>

                {/* Debit / Credit Card */}
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'border-[#FF6B35] bg-[#FFF8F5]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                    className="sr-only"
                  />
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900">Card Payment</span>
                      {paymentMethod === 'card' && <CheckCircle2 className="w-4 h-4 text-[#FF6B35]" />}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Corporate or Personal Card
                    </p>
                  </div>
                </label>

                {/* Pay at Counter */}
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                    paymentMethod === 'cash'
                      ? 'border-[#FF6B35] bg-[#FFF8F5]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="cash"
                    checked={paymentMethod === 'cash'}
                    onChange={() => setPaymentMethod('cash')}
                    className="sr-only"
                  />
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Banknote className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900">Counter Cash</span>
                      {paymentMethod === 'cash' && <CheckCircle2 className="w-4 h-4 text-[#FF6B35]" />}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Pay cash on pickup
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Sticky Bill Details Card */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
            {/* Corporate Subsidy Banner */}
            {subsidyInfo.eligible && subsidyInfo.amount > 0 && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 shadow-xs flex items-start gap-3">
                <Building2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800">
                    {subsidyInfo.company} Meal Subsidy Active
                  </h4>
                  <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
                    You have an eligible corporate subsidy of up to{' '}
                    <span className="font-extrabold">₹{subsidyInfo.amount}</span> for this{' '}
                    <span className="capitalize">{subsidyInfo.mealType || 'current'}</span> slot.
                  </p>
                </div>
              </div>
            )}

            {/* Bill Details Summary Card */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider pb-3 border-b border-gray-100">
                Itemized Bill Details
              </h3>

              <div className="space-y-3 text-xs">
                {/* Items Subtotal */}
                <div className="flex justify-between items-center text-gray-600">
                  <span>Items Subtotal</span>
                  <span className="font-bold text-gray-900 tabular-nums text-sm">
                    ₹{subtotal.toFixed(0)}
                  </span>
                </div>

                {/* Company Subsidy Deduction */}
                {appliedSubsidy > 0 && (
                  <div className="flex justify-between items-center text-emerald-600 font-semibold">
                    <span className="flex items-center gap-1">
                      <span>Employer Meal Subsidy</span>
                    </span>
                    <span className="font-bold tabular-nums text-sm">
                      -₹{appliedSubsidy.toFixed(0)}
                    </span>
                  </div>
                )}

                {/* Counter Pickup / Convenience */}
                <div className="flex justify-between items-center text-gray-600">
                  <span>Pickup Packaging & Service</span>
                  <span className="font-bold text-emerald-600 uppercase tracking-wide text-[11px]">
                    Free (Campus Benefit)
                  </span>
                </div>

                {/* Tax Breakdown Note */}
                <div className="pt-2 border-t border-dashed border-gray-200 text-[11px] text-gray-400 leading-relaxed">
                  Includes ₹{gstInclusiveAmount.toFixed(1)} GST (2.5% CGST + 2.5% SGST)
                </div>

                {/* Grand Total Row */}
                <div className="pt-3 border-t border-gray-200 flex justify-between items-baseline">
                  <div>
                    <span className="text-sm font-extrabold text-gray-900 block">
                      To Pay
                    </span>
                    <span className="text-[10px] text-gray-400">
                      Total net amount after subsidies
                    </span>
                  </div>
                  <span className="text-2xl font-black text-[#004E89] tabular-nums">
                    ₹{netPayable.toFixed(0)}
                  </span>
                </div>

                {/* Live Mathematical Wallet Impact */}
                {paymentMethod === 'wallet' && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-[11px] text-slate-600 mt-2">
                    <div className="flex justify-between">
                      <span>Current Food Wallet:</span>
                      <span className="font-bold text-slate-800">₹{walletBalance.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-bold border-t border-slate-200 pt-1">
                      <span>Balance After Order:</span>
                      <span>₹{Math.max(0, walletBalance - netPayable).toFixed(0)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Checkout CTA Button with 52px Standard Enterprise Height */}
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={placing || (paymentMethod === 'wallet' && !isWalletSufficient)}
                className="w-full h-[52px] rounded-xl bg-[#FF6B35] hover:bg-[#e55a28] text-white font-extrabold text-sm uppercase tracking-wider flex items-center justify-between px-5 shadow-lg shadow-orange-500/25 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer mt-4"
              >
                {placing ? (
                  <span className="flex items-center justify-center w-full gap-2 text-white">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing Order...</span>
                  </span>
                ) : (
                  <>
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Place Cafeteria Order</span>
                    </span>
                    <span className="text-base font-black tabular-nums">
                      ₹{netPayable.toFixed(0)}
                    </span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-center text-gray-400 mt-2">
                🔒 Instant order handover with Pickup OTP & QR Code
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
