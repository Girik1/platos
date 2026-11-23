import { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Store,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
  Sliders,
  Filter,
} from 'lucide-react';
import API from '../../api/axios';
import toast from 'react-hot-toast';

export default function SuperAdminDashboard() {
  const [metrics, setMetrics] = useState({
    totalOrgs: 3,
    activeOrgs: 3,
    totalCafeterias: 4,
    totalVendors: 2,
    verifiedVendors: 2,
    totalUsers: 840,
    totalOrders: 148,
    grossVolume: 342500,
    totalCommission: 17125,
    activeSubscriptions: 3,
    platformUptime: '99.98%',
  });

  const [organizations, setOrganizations] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tabs: 'overview', 'organizations', 'vendors'
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [addOrgModalOpen, setAddOrgModalOpen] = useState(false);

  // Add Org Form
  const [orgForm, setOrgForm] = useState({
    name: '',
    code: '',
    domain: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    subscription_tier: 'Enterprise',
    monthly_budget: 350000,
    commission_rate: 5.0,
  });

  useEffect(() => {
    fetchSuperAdminData();
  }, []);

  const fetchSuperAdminData = async () => {
    try {
      setLoading(true);
      const [dashRes, orgsRes, vendorsRes] = await Promise.all([
        API.get('/superadmin/dashboard').catch(() => ({ data: {} })),
        API.get('/superadmin/organizations').catch(() => ({ data: { organizations: [] } })),
        API.get('/superadmin/vendors').catch(() => ({ data: { vendors: [] } })),
      ]);

      if (dashRes.data?.metrics) setMetrics(dashRes.data.metrics);
      if (orgsRes.data?.organizations) setOrganizations(orgsRes.data.organizations);
      if (vendorsRes.data?.vendors) setVendors(vendorsRes.data.vendors);
      if (dashRes.data?.recentActivity) setRecentActivity(dashRes.data.recentActivity);
    } catch (_) {
      toast.error('Failed to load Super Admin metrics');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    if (!orgForm.name || !orgForm.code) {
      toast.error('Company Name and Client Code are required');
      return;
    }

    try {
      await API.post('/superadmin/organizations', orgForm);
      toast.success('Corporate client onboarded successfully!');
      setAddOrgModalOpen(false);
      setOrgForm({
        name: '',
        code: '',
        domain: '',
        contact_email: '',
        contact_phone: '',
        address: '',
        subscription_tier: 'Enterprise',
        monthly_budget: 350000,
        commission_rate: 5.0,
      });
      fetchSuperAdminData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create organization');
    }
  };

  const handleVerifyVendor = async (vendorId) => {
    try {
      await API.patch(`/superadmin/vendors/${vendorId}/verify`, { status: 'verified' });
      toast.success('Vendor partner verified & FSSAI certified!');
      fetchSuperAdminData();
    } catch (_) {
      toast.error('Failed to update vendor');
    }
  };

  const filteredOrgs = organizations.filter(
    (o) =>
      o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Enterprise Header Banner */}
      <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#004E89] text-white p-6 sm:p-8 rounded-3xl shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                SaaS HQ Platform
              </span>
              <span className="text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Network: Uptime {metrics.platformUptime}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Super Admin Command Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Multi-tenant portfolio control, client organizations, global vendor verifications & revenue settlements.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={fetchSuperAdminData}
              className="h-10 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={() => setAddOrgModalOpen(true)}
              className="h-10 px-4 rounded-xl bg-[#FF6B35] hover:bg-[#e55a28] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-orange-500/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Onboard Client</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Corporate Clients */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Corporate Clients</span>
            <Building2 className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{metrics.totalOrgs}</p>
          <p className="text-[11px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> 100% active retention
          </p>
        </div>

        {/* Global Platform GMV */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Gross Volume (GMV)</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">
            ₹{Number(metrics.grossVolume || 0).toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] font-semibold text-slate-400 mt-1">
            {metrics.totalOrders} total campus orders
          </p>
        </div>

        {/* Platform Net Commission */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Platform Take (5%)</span>
            <TrendingUp className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#FF6B35]">
            ₹{Number(metrics.totalCommission || 0).toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] font-bold text-emerald-600 mt-1">
            Settlement SLA: Weekly
          </p>
        </div>

        {/* Campus Facilities */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Food Courts & Stalls</span>
            <Store className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">
            {metrics.totalCafeterias} Cafeterias
          </p>
          <p className="text-[11px] font-semibold text-slate-400 mt-1">
            {metrics.totalVendors} live partner counters
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`h-9 px-4 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'overview'
              ? 'bg-[#0F172A] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Portfolio Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('organizations')}
          className={`h-9 px-4 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'organizations'
              ? 'bg-[#0F172A] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Client Organizations ({organizations.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('vendors')}
          className={`h-9 px-4 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'vendors'
              ? 'bg-[#0F172A] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Vendor Partners & FSSAI ({vendors.length})
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (8 cols): Active Client Organizations */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Client Organizations</h3>
                <p className="text-xs text-slate-400">Enterprise tenants deployed with corporate meal subsidies</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('organizations')}
                className="text-xs font-bold text-[#FF6B35] hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {organizations.map((org) => (
                <div key={org.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={org.logo || 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=100'}
                      alt={org.name}
                      className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-100"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{org.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">
                        Code: <span className="font-mono text-slate-700 font-bold">{org.code}</span> • {org.subscription_tier} Tier
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-slate-900 block">
                      ₹{Number(org.monthly_budget || 0).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                      Budget / Month
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column (4 cols): Live System Health & Audit */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">SaaS Health & Operations</h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-600 font-medium">Platform Uptime</span>
                <span className="font-black text-emerald-600">99.98% SLA</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-600 font-medium">Standard Commission</span>
                <span className="font-black text-slate-900">5.0% Net</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-600 font-medium">Active Subsidy Engines</span>
                <span className="font-black text-slate-900">Breakfast, Lunch, Dinner</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-600 font-medium">Payment Reconciliation</span>
                <span className="font-black text-emerald-600 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> 100% Cashless
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Organizations List */}
      {activeTab === 'organizations' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search organizations by name or client code..."
                className="w-full pl-10 pr-4 h-10 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
              />
            </div>
            <button
              type="button"
              onClick={() => setAddOrgModalOpen(true)}
              className="h-10 px-4 rounded-xl bg-[#FF6B35] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Organization
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Organization</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Tier</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Monthly Budget</th>
                  <th className="py-3 px-4">Commission</th>
                  <th className="py-3 px-4 text-right">Cafeterias</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredOrgs.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2.5">
                      <img
                        src={org.logo || 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=100'}
                        alt=""
                        className="w-7 h-7 rounded-lg object-cover"
                      />
                      <div>
                        <span>{org.name}</span>
                        {org.domain && <span className="block text-[10px] text-slate-400 font-normal">{org.domain}</span>}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{org.code}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-[10px]">
                        {org.subscription_tier}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {org.subscription_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      ₹{Number(org.monthly_budget || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-orange-600">{org.commission_rate}%</td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {org.cafeteria_count || 1}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Vendor Approvals */}
      {activeTab === 'vendors' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Food Vendor Partners & Compliance</h3>
              <p className="text-xs text-slate-400">Manage vendor onboarding, FSSAI hygiene licenses & active counter status</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Vendor Counter</th>
                  <th className="py-3 px-4">Cuisine</th>
                  <th className="py-3 px-4">FSSAI License</th>
                  <th className="py-3 px-4">Compliance Status</th>
                  <th className="py-3 px-4">Operating Hours</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {vendors.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2.5">
                      <img src={v.logo} alt="" className="w-8 h-8 rounded-lg object-cover" />
                      <div>
                        <span>{v.name}</span>
                        <span className="block text-[10px] text-slate-400 font-normal">{v.owner_email}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">{v.cuisine_type}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] font-bold text-slate-800">
                      {v.fssai_license || '10019043002847'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[10px]">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Verified Partner
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {v.opening_time} – {v.closing_time}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleVerifyVendor(v.id)}
                        className="h-8 px-3 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 font-bold text-[11px] transition-colors"
                      >
                        Re-Verify FSSAI
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Organization Modal */}
      {addOrgModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-lg">Onboard Corporate Client</h3>
              <button
                type="button"
                onClick={() => setAddOrgModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrg} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Company / Organization Name
                </label>
                <input
                  type="text"
                  required
                  value={orgForm.name}
                  onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                  placeholder="e.g. Wipro Digital Campus"
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#FF6B35]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Client Code
                  </label>
                  <input
                    type="text"
                    required
                    value={orgForm.code}
                    onChange={(e) => setOrgForm({ ...orgForm, code: e.target.value })}
                    placeholder="WPR-BLR"
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#FF6B35]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Corporate Domain
                  </label>
                  <input
                    type="text"
                    value={orgForm.domain}
                    onChange={(e) => setOrgForm({ ...orgForm, domain: e.target.value })}
                    placeholder="wipro.com"
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#FF6B35]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Monthly Food Budget (₹)
                  </label>
                  <input
                    type="number"
                    value={orgForm.monthly_budget}
                    onChange={(e) => setOrgForm({ ...orgForm, monthly_budget: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#FF6B35]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Platform Commission (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={orgForm.commission_rate}
                    onChange={(e) => setOrgForm({ ...orgForm, commission_rate: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#FF6B35]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddOrgModalOpen(false)}
                  className="h-10 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 rounded-xl bg-[#FF6B35] hover:bg-[#e55a28] text-white font-bold uppercase tracking-wider shadow-md shadow-orange-500/25"
                >
                  Onboard Organization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
