import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Package, Clock, ChevronRight, RotateCcw, AlertCircle, ShoppingBag, ChefHat } from 'lucide-react';
import API from '../../api/axios';
import OrderStatusBadge from '../../components/common/OrderStatusBadge';
import toast from 'react-hot-toast';

export default function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // all, active, completed
  const [reordering, setReordering] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await API.get('/orders');
      setOrders(res.data?.orders || []);
    } catch (err) {
      toast.error('Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = async (orderId) => {
    try {
      setReordering(orderId);
      await API.post(`/orders/${orderId}/reorder`);
      toast.success('Items added to cart!');
      navigate('/cart');
    } catch (err) {
      toast.error('Failed to reorder items.');
    } finally {
      setReordering(null);
    }
  };

  const activeStatuses = ['placed', 'accepted', 'preparing', 'ready'];
  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'active') return activeStatuses.includes(o.status);
    if (activeTab === 'completed') return !activeStatuses.includes(o.status);
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-6 h-6 text-[#FF6B35]" /> My Cafeteria Orders
            </h1>
            <p className="text-sm text-gray-500 mt-1">Track live kitchen preparations and review past meals</p>
          </div>

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FF6B35] hover:bg-[#e55a28] text-white text-sm font-semibold rounded-xl shadow-xs transition-colors self-start sm:self-auto"
          >
            <ShoppingBag className="w-4 h-4" /> Order Food
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6 bg-white rounded-t-xl px-4 pt-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-3 px-4 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'all'
                ? 'border-[#FF6B35] text-[#FF6B35] font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            All Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`pb-3 px-4 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'active'
                ? 'border-[#FF6B35] text-[#FF6B35] font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Active Orders ({orders.filter((o) => activeStatuses.includes(o.status)).length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`pb-3 px-4 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'completed'
                ? 'border-[#FF6B35] text-[#FF6B35] font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Past Orders ({orders.filter((o) => !activeStatuses.includes(o.status)).length})
          </button>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-9 h-9 border-3 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-500">Fetching your orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-xs">
            <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#FF6B35]">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No orders found</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
              You haven't placed any cafeteria orders in this category yet.
            </p>
            <Link
              to="/"
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF6B35] hover:bg-[#e55a28] text-white font-medium text-sm rounded-xl transition-colors shadow-xs"
            >
              Browse Cafeterias
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const isActive = activeStatuses.includes(order.status);
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-gray-200/80 hover:border-orange-300 transition-all p-5 shadow-xs hover:shadow-md"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-gray-900 text-base">{order.order_number}</span>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(order.created_at).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                        {' • '}
                        <span className="font-medium text-gray-700">{order.vendor_name || 'Cafeteria'}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-black text-[#004E89] tabular-nums">
                        ₹{Math.max(0, (Number(order.total_amount) || 0) - (Number(order.subsidy_amount) || 0)).toFixed(0)}
                      </span>
                      <span className="text-[11px] text-gray-400 block font-medium capitalize">
                        Paid via {order.payment_method || 'Wallet'}
                      </span>
                      {order.subsidy_amount > 0 && (
                        <p className="text-[11px] text-emerald-600 font-bold mt-0.5">
                          Subsidy saved: ₹{order.subsidy_amount}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Items Preview */}
                  <div className="py-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Items</p>
                    <div className="flex flex-wrap gap-2">
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 text-xs bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg text-gray-700"
                          >
                            <span className="font-medium">{item.quantity}x</span>
                            <span>{item.item_name}</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">Order items details</span>
                      )}
                    </div>
                  </div>

                  {/* Actions & OTP */}
                  <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {isActive && order.pickup_otp && (
                        <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 px-3 py-1 rounded-lg">
                          <span className="text-xs text-orange-700 font-medium">Pickup OTP:</span>
                          <span className="font-mono font-bold text-sm text-[#FF6B35] tracking-widest">
                            {order.pickup_otp}
                          </span>
                        </div>
                      )}
                      <span className="text-xs text-gray-400 capitalize">
                        Paid via {order.payment_method || 'UPI'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isActive && (
                        <button
                          onClick={() => handleReorder(order.id)}
                          disabled={reordering === order.id}
                          className="px-3.5 py-1.5 border border-gray-200 hover:border-[#FF6B35] hover:text-[#FF6B35] text-gray-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
                        >
                          <RotateCcw className={`w-3.5 h-3.5 ${reordering === order.id ? 'animate-spin' : ''}`} />
                          Reorder
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/orders/${order.id}`)}
                        className="px-4 py-1.5 bg-[#FF6B35] hover:bg-[#e55a28] text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
                      >
                        {isActive ? 'Track Live' : 'View Receipt'}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
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