import { useState, useEffect } from 'react';
import { Store, Plus, Check, X, Search, Star, Clock, AlertCircle } from 'lucide-react';
import API from '../../api/axios';
import toast from 'react-hot-toast';

export default function AdminVendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [users, setUsers] = useState([]);

  const [form, setForm] = useState({
    user_id: '',
    name: '',
    description: '',
    cuisine_type: 'North & South Indian',
    opening_time: '08:00',
    closing_time: '21:00',
  });

  useEffect(() => {
    fetchVendors();
    fetchUsers();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const res = await API.get('/vendors');
      setVendors(res.data?.vendors || []);
    } catch (err) {
      toast.error('Failed to load vendors.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await API.get('/admin/users');
      setUsers(res.data?.users || []);
    } catch (_) {}
  };

  const handleToggleStatus = async (vendor) => {
    try {
      const newStatus = vendor.is_active === 1 ? 0 : 1;
      await API.put(`/vendors/${vendor.id}`, { is_active: newStatus });
      toast.success(`${vendor.name} is now ${newStatus ? 'Active' : 'Inactive'}`);
      fetchVendors();
    } catch (err) {
      toast.error('Failed to update status.');
    }
  };

  const handleCreateVendor = async (e) => {
    e.preventDefault();
    if (!form.user_id || !form.name) {
      toast.error('Please select an owner account and provide counter name.');
      return;
    }

    try {
      await API.post('/vendors', form);
      toast.success('Vendor counter registered successfully!');
      setModalOpen(false);
      fetchVendors();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create vendor.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Store className="w-6 h-6 text-[#FF6B35]" /> Cafeteria Vendors & Counters
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Onboard food stalls, configure operating hours, and manage live counters
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="px-5 py-2.5 bg-[#FF6B35] hover:bg-[#e55a28] text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Onboard New Vendor
          </button>
        </div>

        {/* Vendors List */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-3 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {vendors.map((v) => (
              <div
                key={v.id}
                className="bg-white rounded-3xl border border-gray-200/80 hover:border-orange-300 p-6 shadow-xs flex flex-col justify-between space-y-4 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-base text-gray-900">{v.name}</h3>
                      <p className="text-xs text-[#FF6B35] font-semibold">{v.cuisine_type || 'Multi-Cuisine'}</p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        v.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {v.is_active ? '● Active' : '○ Closed'}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">{v.description}</p>

                  <div className="pt-3 space-y-1.5 text-xs text-gray-500">
                    <p className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      Hours: {v.opening_time} - {v.closing_time}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      Rating: {v.avg_rating || v.rating || '4.5'} ({v.review_count || 12} reviews)
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Owner: {v.owner_name} ({v.owner_email})
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400">{v.item_count || 0} active menu dishes</span>
                  <button
                    onClick={() => handleToggleStatus(v)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                      v.is_active
                        ? 'border-red-200 text-red-600 hover:bg-red-50'
                        : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    {v.is_active ? 'Deactivate Counter' : 'Activate Counter'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                <h3 className="font-bold text-gray-900 text-base">Register Vendor Counter</h3>
                <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateVendor} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Select Vendor Account *
                  </label>
                  <select
                    required
                    value={form.user_id}
                    onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#FF6B35]"
                  >
                    <option value="">-- Choose User --</option>
                    {users
                      .filter((u) => u.role === 'vendor' || u.role === 'admin')
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Counter / Stall Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Chai Point Express"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#FF6B35]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Cuisine Type
                  </label>
                  <input
                    type="text"
                    value={form.cuisine_type}
                    onChange={(e) => setForm({ ...form, cuisine_type: e.target.value })}
                    placeholder="e.g. Beverages & Quick Bites"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#FF6B35]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Opening Time
                    </label>
                    <input
                      type="time"
                      value={form.opening_time}
                      onChange={(e) => setForm({ ...form, opening_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Closing Time
                    </label>
                    <input
                      type="time"
                      value={form.closing_time}
                      onChange={(e) => setForm({ ...form, closing_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Description
                  </label>
                  <textarea
                    rows="2"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Freshly brewed artisanal teas, coffee and snacks"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#FF6B35] text-white rounded-xl text-xs font-semibold hover:bg-[#e55a28]"
                  >
                    Onboard Counter
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}