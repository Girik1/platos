import { useState, useEffect } from 'react';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  BellRing,
  Check,
  Search,
  KeyRound,
  RefreshCw,
  ShoppingBag,
  AlertCircle
} from 'lucide-react';
import API from '../../api/axios';
import OrderStatusBadge from '../../components/common/OrderStatusBadge';
import toast from 'react-hot-toast';

export default function VendorOrders() {
  const [liveOrders, setLiveOrders] = useState([]);
  const [historyOrders, setHistoryOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // all, placed, preparing, ready, history
  const [loading, setLoading] = useState(true);
  const [otpInputs, setOtpInputs] = useState({});
  const [verifying, setVerifying] = useState(null);

  useEffect(() => {
    fetchOrders();
    const timer = setInterval(fetchOrders, 8000);
    return () => clearInterval(timer);
  }, []);

  const fetchOrders = async () => {
    try {
      const [liveRes, histRes] = await Promise.all([
        API.get('/orders/vendor/live').catch(() => ({ data: { orders: [] } })),
        API.get('/orders/vendor/history').catch(() => ({ data: { orders: [] } })),
      ]);
      setLiveOrders(liveRes.data?.orders || []);
      setHistoryOrders(histRes.data?.orders || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, status) => {
    try {
      await API.patch(`/orders/${orderId}/status`, { status });
      toast.success(`Order updated to ${status}`);
      fetchOrders();
    } catch (err) {
      toast.error('Failed to update status.');
    }
  };

  const handleVerifyOtp = async (orderId) => {
    const otp = otpInputs[orderId];
    if (!otp || otp.length < 4) {
      toast.error('Please enter 4-digit pickup OTP.');
      return;
    }

    try {
      setVerifying(orderId);
      await API.post(`/orders/${orderId}/verify`, { otp });
      toast.success('OTP verified! Order handed over to employee. 🎉');
      setOtpInputs((prev) => ({ ...prev, [orderId]: '' }));
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid OTP. Check customer phone/receipt.');
    } finally {
      setVerifying(null);
    }
  };

  const ordersToShow = () => {
    if (activeTab === 'history') return historyOrders;
    if (activeTab === 'placed') return liveOrders.filter((o) => o.status === 'placed');
    if (activeTab === 'preparing') return liveOrders.filter((o) => o.status === 'accepted' || o.status === 'preparing');
    if (activeTab === 'ready') return liveOrders.filter((o) => o.status === 'ready');
    return liveOrders;
  };

  const currentList = ordersToShow();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ChefHat className="w-6 h-6 text-[#FF6B35]" /> Kitchen Display System (KDS)
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage kitchen prep workflow and counter handovers with OTP</p>
          </div>

          <button
            onClick={fetchOrders}
            className="px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 rounded-xl text-xs font-semibold text-gray-700 flex items-center gap-1.5 shadow-xs self-start sm:self-auto"
          >
            <RefreshCw className="w-4 h-4" /> Refresh Screen
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
          {[
            { key: 'all', label: 'All Live', count: liveOrders.length },
            { key: 'placed', label: 'New Placed', count: liveOrders.filter((o) => o.status === 'placed').length },
            {
              key: 'preparing',
              label: 'In Kitchen',
              count: liveOrders.filter((o) => o.status === 'accepted' || o.status === 'preparing').length,
            },
            { key: 'ready', label: 'Ready for Counter', count: liveOrders.filter((o) => o.status === 'ready').length },
            { key: 'history', label: 'Completed History', count: historyOrders.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-[#FF6B35] text-white shadow-xs'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Orders Grid */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-3 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : currentList.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-900">No orders in this stage</h3>
            <p className="text-xs text-gray-400 mt-1">Orders will appear here as they progress through the kitchen.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {currentList.map((order) => {
              const isReady = order.status === 'ready';

              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between shadow-xs ${
                    isReady ? 'border-emerald-300 ring-2 ring-emerald-50' : 'border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold text-gray-900">{order.order_number}</span>
                        <p className="text-xs text-gray-500 font-medium">
                          {order.customer_name || 'Employee'} • {order.customer_phone || ''}
                        </p>
                      </div>
                      <OrderStatusBadge status={order.status} />
                    </div>

                    {/* Items table */}
                    <div className="bg-gray-50 rounded-xl p-3 divide-y divide-gray-100">
                      {order.items &&
                        order.items.map((it, idx) => (
                          <div key={idx} className="py-1.5 flex justify-between text-xs">
                            <span className="font-semibold text-gray-800">
                              <span className="text-[#FF6B35] font-bold">{it.quantity}x</span> {it.item_name}
                            </span>
                            <span className="text-gray-500">₹{it.item_price * it.quantity}</span>
                          </div>
                        ))}
                    </div>

                    {order.special_instructions && (
                      <p className="text-xs text-amber-800 bg-amber-50 p-2 rounded-lg font-medium">
                        Chef Note: {order.special_instructions}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                      <span>Time: {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-sm font-bold text-gray-900">Total: ₹{order.total_amount}</span>
                    </div>
                  </div>

                  {/* Actions / OTP Verification Box */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    {order.status === 'placed' && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'accepted')}
                          className="py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                          className="py-2 bg-red-50 text-red-600 rounded-xl text-xs font-semibold hover:bg-red-100"
                        >
                          Decline
                        </button>
                      </div>
                    )}

                    {order.status === 'accepted' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'preparing')}
                        className="w-full py-2 bg-[#FF6B35] hover:bg-[#e55a28] text-white rounded-xl text-xs font-semibold"
                      >
                        Start Food Preparation
                      </button>
                    )}

                    {order.status === 'preparing' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'ready')}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
                      >
                        Notify Customer: Ready for Counter
                      </button>
                    )}

                    {/* READY -> Handover with OTP */}
                    {order.status === 'ready' && (
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                          <KeyRound className="w-3.5 h-3.5" /> Enter Customer OTP:
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength="4"
                            placeholder="4-digit OTP"
                            value={otpInputs[order.id] || ''}
                            onChange={(e) =>
                              setOtpInputs({ ...otpInputs, [order.id]: e.target.value })
                            }
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-xl text-center text-sm font-mono font-bold tracking-widest focus:ring-2 focus:ring-emerald-500"
                          />
                          <button
                            onClick={() => handleVerifyOtp(order.id)}
                            disabled={verifying === order.id}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shrink-0"
                          >
                            {verifying === order.id ? '...' : 'Handover'}
                          </button>
                        </div>
                      </div>
                    )}

                    {order.status === 'picked_up' && (
                      <p className="text-xs text-gray-500 text-center font-medium">
                        ✓ Handed over to employee
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}