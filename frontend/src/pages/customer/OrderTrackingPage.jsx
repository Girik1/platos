import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  ChefHat,
  BellRing,
  PackageCheck,
  QrCode,
  ArrowLeft,
  Store,
  Sparkles,
  RefreshCw,
  Copy,
  Receipt,
  AlertCircle
} from 'lucide-react';
import API from '../../api/axios';
import OrderStatusBadge from '../../components/common/OrderStatusBadge';
import toast from 'react-hot-toast';

const steps = [
  { key: 'placed', label: 'Order Placed', desc: 'Sent to kitchen counter', icon: Clock },
  { key: 'accepted', label: 'Accepted', desc: 'Chef acknowledged order', icon: CheckCircle2 },
  { key: 'preparing', label: 'Preparing', desc: 'Food is being cooked fresh', icon: ChefHat },
  { key: 'ready', label: 'Ready for Pickup', desc: 'Counter pickup is ready', icon: BellRing },
  { key: 'picked_up', label: 'Completed', desc: 'Collected by you', icon: PackageCheck },
];

export default function OrderTrackingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    fetchOrder();
    // Auto refresh every 5 seconds while order is active
    const timer = setInterval(() => {
      fetchOrder(true);
    }, 5000);
    return () => clearInterval(timer);
  }, [id]);

  const fetchOrder = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      else setPolling(true);

      const res = await API.get(`/orders/${id}`);
      setOrder(res.data?.order || res.data);
    } catch (err) {
      if (!isBackground) toast.error('Failed to load order tracking.');
    } finally {
      if (!isBackground) setLoading(false);
      setPolling(false);
    }
  };

  const copyOTP = () => {
    if (order?.pickup_otp) {
      navigator.clipboard.writeText(order.pickup_otp);
      toast.success('Pickup OTP copied!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium text-gray-500">Connecting to kitchen counter...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
        <h2 className="text-xl font-bold text-gray-900">Order Not Found</h2>
        <p className="text-sm text-gray-500 mt-1 mb-4">We couldn't locate this order in your cafeteria records.</p>
        <Link to="/orders" className="px-4 py-2 bg-[#FF6B35] text-white font-medium rounded-xl text-sm">
          Back to Orders
        </Link>
      </div>
    );
  }

  const currentStepIndex = steps.findIndex((s) => s.key === order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Back Link */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/orders')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-[#FF6B35] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to My Orders
          </button>
          <div className="flex items-center gap-2">
            {polling && (
              <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin" /> Live sync
              </span>
            )}
            <OrderStatusBadge status={order.status} />
          </div>
        </div>

        {/* Hero Pickup Card */}
        {!isCancelled && order.status !== 'picked_up' && (
          <div className="bg-gradient-to-br from-[#1A1A2E] to-[#004E89] text-white rounded-3xl p-6 sm:p-8 mb-6 shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 -mt-6 -mr-6 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              {/* Pickup info */}
              <div className="text-center sm:text-left space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-orange-300">
                  <Sparkles className="w-3.5 h-3.5" /> Present at Cafeteria Counter
                </span>
                <h1 className="text-3xl font-extrabold tracking-tight">Order #{order.order_number}</h1>
                <p className="text-sm text-gray-300">
                  {order.vendor_name || 'Cafeteria Kitchen'} • Fast Counter Collection
                </p>

                {/* Big OTP Display */}
                {order.pickup_otp && (
                  <div className="pt-2 flex items-center justify-center sm:justify-start gap-3">
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-3">
                      <p className="text-[11px] uppercase tracking-wider text-gray-300 font-semibold">Pickup OTP</p>
                      <div className="flex items-center gap-2">
                        <span className="text-3xl font-black font-mono tracking-widest text-[#FF6B35]">
                          {order.pickup_otp}
                        </span>
                        <button
                          onClick={copyOTP}
                          title="Copy OTP"
                          className="p-1 hover:bg-white/10 rounded text-gray-300 hover:text-white transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* QR Code */}
              {order.qr_code && (
                <div className="bg-white p-3 rounded-2xl shadow-lg text-center flex flex-col items-center">
                  <img
                    src={order.qr_code}
                    alt="Order Pickup QR Code"
                    className="w-36 h-36 object-contain rounded-lg"
                  />
                  <span className="text-[11px] font-bold text-gray-800 mt-1 flex items-center gap-1">
                    <QrCode className="w-3.5 h-3.5 text-[#FF6B35]" /> Scan at Counter
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status Tracker */}
        {!isCancelled && (
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 mb-6 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">
              Live Kitchen Progress
            </h3>

            <div className="relative">
              {/* Stepper for Desktop */}
              <div className="hidden sm:grid grid-cols-5 gap-2">
                {steps.map((s, idx) => {
                  const isDone = currentStepIndex >= idx;
                  const isCurrent = currentStepIndex === idx;
                  const Icon = s.icon;

                  return (
                    <div key={s.key} className="flex flex-col items-center text-center">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                          isDone
                            ? isCurrent
                              ? 'bg-[#FF6B35] text-white ring-4 ring-orange-100 shadow-md'
                              : 'bg-emerald-500 text-white shadow-xs'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <p
                        className={`text-xs font-bold mt-2 ${
                          isDone ? 'text-gray-900' : 'text-gray-400'
                        }`}
                      >
                        {s.label}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{s.desc}</p>
                    </div>
                  );
                })}
              </div>

              {/* Stepper for Mobile (Vertical) */}
              <div className="sm:hidden space-y-4">
                {steps.map((s, idx) => {
                  const isDone = currentStepIndex >= idx;
                  const isCurrent = currentStepIndex === idx;
                  const Icon = s.icon;

                  return (
                    <div key={s.key} className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isDone
                            ? isCurrent
                              ? 'bg-[#FF6B35] text-white ring-2 ring-orange-200'
                              : 'bg-emerald-500 text-white'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className={`text-xs font-bold ${isDone ? 'text-gray-900' : 'text-gray-400'}`}>
                          {s.label}
                        </p>
                        <p className="text-[11px] text-gray-400">{s.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Order Items & Receipt */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#FF6B35]" /> Order Details & Receipt
            </h3>
            <span className="text-xs text-gray-400">
              {new Date(order.created_at).toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </span>
          </div>

          {/* Items list */}
          <div className="divide-y divide-gray-100 mb-6">
            {order.items &&
              order.items.map((item, idx) => {
                let addons = [];
                try {
                  if (item.addons_json) addons = typeof item.addons_json === 'string' ? JSON.parse(item.addons_json) : item.addons_json;
                } catch (_) {}

                const addonSum = addons.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
                const itemUnitTotal = (Number(item.item_price) || 0) + addonSum;
                const lineTotal = itemUnitTotal * (Number(item.quantity) || 1);

                return (
                  <div key={idx} className="py-3 flex items-center justify-between text-sm">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800">{item.quantity}x</span>
                        <span className="text-gray-900 font-medium">{item.item_name}</span>
                      </div>
                      {addons.length > 0 && (
                        <p className="text-xs text-gray-500 mt-0.5 ml-6">
                          Addons: {addons.map((a) => `${a.name} (+₹${a.price})`).join(', ')}
                        </p>
                      )}
                    </div>
                    <span className="font-semibold text-gray-800 tabular-nums">
                      ₹{lineTotal.toFixed(0)}
                    </span>
                  </div>
                );
              })}
          </div>

          {/* Pricing summary */}
          <div className="space-y-2 pt-4 border-t border-gray-100 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Item Total</span>
              <span>₹{order.total_amount}</span>
            </div>
            {order.subsidy_amount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Corporate Meal Subsidy</span>
                <span>-₹{order.subsidy_amount}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100">
              <span>Amount Paid</span>
              <span>₹{Math.max(0, order.total_amount - (order.subsidy_amount || 0))}</span>
            </div>
          </div>

          {/* Special Instructions */}
          {order.special_instructions && (
            <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100 text-xs text-amber-800">
              <span className="font-semibold">Special Instructions:</span> {order.special_instructions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}