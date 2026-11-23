import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, Mail, Phone, Building, Wallet, ShieldCheck, Sparkles, LogOut, Check, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateProfile, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    company: user?.company || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await updateProfile(formData);
      setEditing(false);
      toast.success('Profile details updated!');
    } catch (err) {
      toast.error('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#FF6B35] to-[#004E89] text-white flex items-center justify-center text-3xl font-bold shadow-md shadow-orange-500/10">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
                <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-100 text-[#FF6B35] capitalize w-fit self-center sm:self-auto">
                  {user?.role}
                </span>
              </div>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-gray-400" />
                  {user?.company || 'No Company'}
                </span>
                {user?.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    {user?.phone}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => setEditing(!editing)}
              className="px-3.5 py-2 border border-gray-200 hover:border-gray-300 text-gray-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors self-center sm:self-start"
            >
              <Edit2 className="w-3.5 h-3.5" />
              {editing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </div>

        {/* Corporate Wallet & Benefits Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-[#004E89] to-[#003366] text-white p-6 rounded-2xl shadow-sm space-y-2">
            <div className="flex items-center justify-between text-blue-200">
              <span className="text-xs uppercase font-semibold tracking-wider flex items-center gap-1.5">
                <Wallet className="w-4 h-4" /> Cafeteria Wallet
              </span>
              <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">Auto-Reload</span>
            </div>
            <p className="text-3xl font-extrabold tracking-tight">₹{user?.wallet_balance || '500.00'}</p>
            <p className="text-xs text-blue-100 leading-relaxed">
              Available balance for contactless meals across all campus cafeteria counters.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs space-y-2 flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-700">
              <span className="text-xs uppercase font-semibold tracking-wider flex items-center gap-1.5 text-emerald-600">
                <Sparkles className="w-4 h-4" /> Corporate Subsidy
              </span>
              <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{user?.company || 'Corporate'} Meal Scheme</p>
              <p className="text-xs text-gray-500 mt-1">
                Up to ₹50 off breakfast and ₹100 off lunch applied automatically at checkout.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Verified Company Member
            </div>
          </div>
        </div>

        {/* Edit Form */}
        {editing && (
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs animate-in fade-in duration-200">
            <h3 className="text-base font-bold text-gray-900 mb-4">Edit Personal Information</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Company
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[#FF6B35] text-white rounded-xl text-xs font-semibold hover:bg-[#e55a28] flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Logout Button */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Sign Out</h4>
            <p className="text-xs text-gray-500">Log out of your cafeteria account on this device</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </div>
    </div>
  );
}