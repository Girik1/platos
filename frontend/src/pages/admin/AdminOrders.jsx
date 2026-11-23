import { useState, useEffect } from 'react';
import { ShoppingBag, Search, Filter, Eye, X, Receipt, CheckCircle, Clock } from 'lucide-react';
import API from '../../api/axios';
import OrderStatusBadge from '../../components/common/OrderStatusBadge';
import toast from 'react-hot-toast';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      let url = '/admin/orders?limit=50';
      if (statusFilter) url += `&status=${statusFilter}`;
      const res = await API.get(url);
      setOrders(res.data?.orders || []);
    } catch (err) {
      toast.error('Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-[#FF6B35]" /> Cafeteria Transaction Audit Log
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Live records of all orders placed across all corporate cafeterias
            </p>
          </div>

          {/* Filter dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
            >
              <option value="">All Statuses</option>
              <option value="placed">Placed</option>
              <option value="accepted">Accepted</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="picked_up">Picked Up</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-20 flex justify-center">
              <div className="w-8 h-8 border-3 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400">No orders found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-400 uppercase font-semibold">
                    <th className="py-3.5 px-4">Order #</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Vendor Counter</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Subsidy</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Time</th>
                    <th className="py-3.5 px-4 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold font-mono text-gray-900">{o.order_number}</td>
                      <td className="py-3.5 px-4 font-medium">{o.customer_name}</td>
                      <td className="py-3.5 px-4 text-gray-600">{o.vendor_name}</td>
                      <td className="py-3.5 px-4 font-bold text-gray-900">₹{o.total_amount}</td>
                      <td className="py-3.5 px-4 text-emerald-600 font-semibold">
                        {o.subsidy_amount > 0 ? `₹${o.subsidy_amount}` : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <OrderStatusBadge status={o.status} />
                      </td>
                      <td className="py-3.5 px-4 text-gray-400">
                        {new Date(o.created_at).toLocaleString('en-IN', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="p-1.5 hover:bg-orange-50 text-gray-500 hover:text-[#FF6B35] rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Order #{selectedOrder.order_number}</h3>
                  <p className="text-xs text-gray-500">{selectedOrder.vendor_name}</p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Customer</span>
                  <span className="font-semibold text-gray-800">{selectedOrder.customer_name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Pickup OTP</span>
                  <span className="font-mono font-bold text-[#FF6B35] text-sm">
                    {selectedOrder.pickup_otp || '—'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Payment Method</span>
                  <span className="font-semibold uppercase text-gray-800">
                    {selectedOrder.payment_method || 'UPI'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Status</span>
                  <OrderStatusBadge status={selectedOrder.status} />
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Total Amount</span>
                  <span className="font-bold text-gray-900 text-sm">₹{selectedOrder.total_amount}</span>
                </div>
                {selectedOrder.subsidy_amount > 0 && (
                  <div className="flex justify-between py-1 border-b border-gray-50 text-emerald-600">
                    <span>Corporate Subsidy</span>
                    <span className="font-semibold">-₹{selectedOrder.subsidy_amount}</span>
                  </div>
                )}
                {selectedOrder.special_instructions && (
                  <div className="p-2 bg-amber-50 rounded-lg text-amber-800 mt-2">
                    Note: {selectedOrder.special_instructions}
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}