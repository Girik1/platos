import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ChefHat,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  ArrowRight,
  RefreshCw,
  Bell,
  UtensilsCrossed,
  Sparkles
} from 'lucide-react';
import API from '../../api/axios';
import OrderStatusBadge from '../../components/common/OrderStatusBadge';
import toast from 'react-hot-toast';

export default function VendorDashboard() {
  const [liveOrders, setLiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vendorInfo, setVendorInfo] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 8000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [ordersRes, vendorRes] = await Promise.all([
        API.get('/orders/vendor/live').catch(() => ({ data: { orders: [] } })),
        API.get('/vendors/my/current').catch(() => ({ data: { vendor: null } })),
      ]);
      setLiveOrders(ordersRes.data?.orders || []);
      setVendorInfo(vendorRes.data?.vendor || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, status) => {
    try {
      setActionLoading(orderId);
      await API.patch(`/orders/${orderId}/status`, { status });
      toast.success(`Order marked as ${status}!`);
      fetchDashboardData();
    } catch (err) {
      toast.error('Failed to update status.');
    } finally {
      setActionLoading(null);
    }
  };

  const pendingOrders = liveOrders.filter((o) => o.status === 'placed');
  const preparingOrders = liveOrders.filter((o) => o.status === 'accepted' || o.status === 'preparing');
  const readyOrders = liveOrders.filter((o) => o.status === 'ready');

  const todayRevenue = liveOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-orange-100 text-[#FF6B35] rounded-xl">
                <ChefHat className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {vendorInfo?.name || 'Kitchen Live Dashboard'}
                </h1>
                <p className="text-xs text-gray-500">
                  {vendorInfo?.cuisine_type || 'Fast Service'} Cafeteria Counter • Real-time Order Management
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchDashboardData}
              className="p-2.5 border border-gray-200 hover:border-gray-300 rounded-xl text-gray-600 transition-colors"
              title="Refresh Orders"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <Link
              to="/vendor/orders"
              className="px-4 py-2.5 bg-[#FF6B35] hover:bg-[#e55a28] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <span>Full Kitchen KDS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
            <p className="text-xs uppercase font-semibold text-gray-400">New Incoming</p>
            <p className="text-2xl font-extrabold text-amber-600 mt-1">{pendingOrders.length}</p>
            <p className="text-[11px] text-gray-400 mt-1">Requires kitchen confirmation</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
            <p className="text-xs uppercase font-semibold text-gray-400">Now Cooking</p>
            <p className="text-2xl font-extrabold text-orange-600 mt-1">{preparingOrders.length}</p>
            <p className="text-[11px] text-gray-400 mt-1">On cooking stoves & grills</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
            <p className="text-xs uppercase font-semibold text-gray-400">Ready at Counter</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">{readyOrders.length}</p>
            <p className="text-[11px] text-gray-400 mt-1">Awaiting employee pickup</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
            <p className="text-xs uppercase font-semibold text-gray-400">Live Active Total</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">{liveOrders.length}</p>
            <p className="text-[11px] text-gray-400 mt-1">₹{todayRevenue} active volume</p>
          </div>
        </div>

        {/* Live Incoming Orders */}
        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
              <h2 className="text-base font-bold text-gray-900">Live Order Queue ({liveOrders.length})</h2>
            </div>
            <Link
              to="/vendor/orders"
              className="text-xs font-semibold text-[#FF6B35] hover:underline flex items-center gap-1"
            >
              Open KDS Full Screen <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="w-8 h-8 border-3 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : liveOrders.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <UtensilsCrossed className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">No live orders right now.</p>
              <p className="text-xs mt-1">New customer orders will appear here automatically.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-gray-50/70 border border-gray-200 rounded-2xl p-4 flex flex-col justify-between hover:border-orange-300 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-base text-gray-900">{order.order_number}</span>
                      <p className="text-xs text-gray-500">{order.customer_name || 'Employee'}</p>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>

                  {/* Items */}
                  <div className="bg-white p-3 rounded-xl border border-gray-100 space-y-1.5 text-xs">
                    {order.items &&
                      order.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between font-medium text-gray-800">
                          <span>
                            <strong className="text-orange-600">{it.quantity}x</strong> {it.item_name}
                          </span>
                          <span>₹{it.item_price * it.quantity}</span>
                        </div>
                      ))}
                    {order.special_instructions && (
                      <p className="text-[11px] text-amber-700 bg-amber-50 p-1.5 rounded mt-1">
                        Note: {order.special_instructions}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-gray-400">
                      OTP:{' '}
                      <strong className="text-gray-900 font-mono text-sm tracking-wider">
                        {order.pickup_otp}
                      </strong>
                    </span>
                    <span className="text-sm font-bold text-gray-900">₹{order.total_amount}</span>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
                    {order.status === 'placed' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'accepted')}
                          disabled={actionLoading === order.id}
                          className="py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                          disabled={actionLoading === order.id}
                          className="py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {order.status === 'accepted' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'preparing')}
                        disabled={actionLoading === order.id}
                        className="col-span-2 py-1.5 bg-[#FF6B35] hover:bg-[#e55a28] text-white rounded-xl text-xs font-semibold"
                      >
                        Start Cooking
                      </button>
                    )}
                    {order.status === 'preparing' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'ready')}
                        disabled={actionLoading === order.id}
                        className="col-span-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
                      >
                        Mark Ready for Counter
                      </button>
                    )}
                    {order.status === 'ready' && (
                      <Link
                        to="/vendor/orders"
                        className="col-span-2 py-1.5 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-semibold text-center"
                      >
                        Verify OTP for Handover
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}