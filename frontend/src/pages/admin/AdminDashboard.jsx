import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Store,
  ShoppingBag,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Building,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import API from '../../api/axios';
import OrderStatusBadge from '../../components/common/OrderStatusBadge';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    totalVendors: 0,
    todayOrders: 0,
    todayRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [dashRes, ordersRes, anaRes] = await Promise.all([
        API.get('/admin/dashboard').catch(() => ({ data: { stats: {} } })),
        API.get('/admin/orders?limit=5').catch(() => ({ data: { orders: [] } })),
        API.get('/admin/analytics').catch(() => ({ data: {} })),
      ]);
      setStats(dashRes.data?.stats || {});
      setRecentOrders(ordersRes.data?.orders || []);
      setAnalytics(anaRes.data || null);
    } catch (err) {
      toast.error('Failed to load admin stats.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#1A1A2E] to-[#004E89] text-white p-6 sm:p-8 rounded-3xl shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full bg-white/10 text-orange-300">
                Enterprise Command Center
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Platos Cafeteria Admin</h1>
            <p className="text-xs sm:text-sm text-blue-100 mt-1">
              Centralized cafeteria performance, vendor management, employee subsidies & transactions
            </p>
          </div>

          <button
            onClick={fetchAdminData}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Metrics
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Volume</span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              ₹{Number(stats.totalRevenue || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-emerald-600 font-medium mt-1">
              +₹{stats.todayRevenue || 0} today
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Orders</span>
              <ShoppingBag className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-gray-900">{stats.totalOrders || 0}</p>
            <p className="text-xs text-blue-600 font-medium mt-1">
              {stats.todayOrders || 0} placed today
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Counters</span>
              <Store className="w-4 h-4 text-[#FF6B35]" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-gray-900">{stats.totalVendors || 0}</p>
            <p className="text-xs text-gray-400 mt-1">Live food partners</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Enrolled Users</span>
              <Users className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-gray-900">{stats.totalUsers || 0}</p>
            <p className="text-xs text-purple-600 font-medium mt-1">Corporate employees</p>
          </div>
        </div>

        {/* Quick Management Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/admin/vendors"
            className="bg-white p-5 rounded-2xl border border-gray-200/80 hover:border-orange-300 shadow-xs flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-50 text-[#FF6B35] rounded-xl group-hover:scale-105 transition-transform">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Vendor Counters</h4>
                <p className="text-xs text-gray-400">Add or manage stalls</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#FF6B35] transition-colors" />
          </Link>

          <Link
            to="/admin/users"
            className="bg-white p-5 rounded-2xl border border-gray-200/80 hover:border-blue-300 shadow-xs flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 text-[#004E89] rounded-xl group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Employee Directory</h4>
                <p className="text-xs text-gray-400">Manage user accounts</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#004E89] transition-colors" />
          </Link>

          <Link
            to="/admin/orders"
            className="bg-white p-5 rounded-2xl border border-gray-200/80 hover:border-emerald-300 shadow-xs flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Transaction Logs</h4>
                <p className="text-xs text-gray-400">All cafeteria orders</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition-colors" />
          </Link>
        </div>

        {/* Recent Orders Table */}
        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Recent Cafeteria Orders</h3>
            <Link
              to="/admin/orders"
              className="text-xs font-semibold text-[#FF6B35] hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="w-7 h-7 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : recentOrders.length === 0 ? (
            <p className="py-8 text-center text-xs text-gray-400">No recent orders.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 uppercase font-semibold">
                    <th className="py-3 px-2">Order #</th>
                    <th className="py-3 px-2">Customer</th>
                    <th className="py-3 px-2">Vendor</th>
                    <th className="py-3 px-2">Total</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-2 font-bold font-mono text-gray-900">{o.order_number}</td>
                      <td className="py-3 px-2 font-medium">{o.customer_name}</td>
                      <td className="py-3 px-2 text-gray-500">{o.vendor_name}</td>
                      <td className="py-3 px-2 font-bold text-gray-900">₹{o.total_amount}</td>
                      <td className="py-3 px-2">
                        <OrderStatusBadge status={o.status} />
                      </td>
                      <td className="py-3 px-2 text-gray-400">
                        {new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}