import { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Wallet,
  DollarSign,
  TrendingUp,
  Plus,
  RefreshCw,
  Search,
  Sliders,
  CheckCircle2,
  FileDown,
  ChevronRight,
  ShieldCheck,
  Clock,
  Sparkles,
} from 'lucide-react';
import API from '../../api/axios';
import toast from 'react-hot-toast';

export default function OrgAdminDashboard() {
  const [orgData, setOrgData] = useState(null);
  const [stats, setStats] = useState({
    totalEmployees: 840,
    totalCafeterias: 2,
    monthlyBudget: 500000,
    totalSpentThisMonth: 342500,
    subsidySpent: 84000,
    budgetRemaining: 416000,
  });

  const [cafeterias, setCafeterias] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [subsidies, setSubsidies] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tabs: 'overview', 'cafeterias', 'subsidies', 'employees'
  const [activeTab, setActiveTab] = useState('overview');
  const [searchEmployee, setSearchEmployee] = useState('');

  // Modals
  const [addCafeteriaModal, setAddCafeteriaModal] = useState(false);
  const [addSubsidyModal, setAddSubsidyModal] = useState(false);
  const [topupModal, setTopupModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [grantAmount, setGrantAmount] = useState(500);

  // Forms
  const [cafeteriaForm, setCafeteriaForm] = useState({
    name: '',
    code: '',
    location_building: 'Tower 4 North Wing',
    floor: '2nd Floor',
    capacity: 250,
    opening_time: '07:30',
    closing_time: '21:30',
  });

  const [subsidyForm, setSubsidyForm] = useState({
    meal_type: 'lunch',
    amount: 100,
    subsidy_percent: 100,
    daily_cap: 200,
    department_id: '',
  });

  useEffect(() => {
    fetchOrgAdminData();
  }, []);

  const fetchOrgAdminData = async () => {
    try {
      setLoading(true);
      const [currentRes, cafesRes, deptsRes, subsRes, empsRes] = await Promise.all([
        API.get('/organizations/current').catch(() => ({ data: {} })),
        API.get('/organizations/cafeterias').catch(() => ({ data: { cafeterias: [] } })),
        API.get('/organizations/departments').catch(() => ({ data: { departments: [] } })),
        API.get('/organizations/subsidies').catch(() => ({ data: { subsidies: [] } })),
        API.get('/organizations/employees').catch(() => ({ data: { employees: [] } })),
      ]);

      if (currentRes.data?.organization) setOrgData(currentRes.data.organization);
      if (currentRes.data?.stats) setStats(currentRes.data.stats);
      if (cafesRes.data?.cafeterias) setCafeterias(cafesRes.data.cafeterias);
      if (deptsRes.data?.departments) setDepartments(deptsRes.data.departments);
      if (subsRes.data?.subsidies) setSubsidies(subsRes.data.subsidies);
      if (empsRes.data?.employees) setEmployees(empsRes.data.employees);
    } catch (_) {
      toast.error('Failed to load company data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCafeteria = async (e) => {
    e.preventDefault();
    if (!cafeteriaForm.name || !cafeteriaForm.code) {
      toast.error('Cafeteria name and code are required');
      return;
    }

    try {
      await API.post('/organizations/cafeterias', cafeteriaForm);
      toast.success('Campus cafeteria facility created!');
      setAddCafeteriaModal(false);
      setCafeteriaForm({
        name: '',
        code: '',
        location_building: 'Tower 4 North Wing',
        floor: '2nd Floor',
        capacity: 250,
        opening_time: '07:30',
        closing_time: '21:30',
      });
      fetchOrgAdminData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create cafeteria');
    }
  };

  const handleCreateSubsidy = async (e) => {
    e.preventDefault();
    try {
      await API.post('/organizations/subsidies', subsidyForm);
      toast.success('Corporate meal allowance policy saved!');
      setAddSubsidyModal(false);
      fetchOrgAdminData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save subsidy');
    }
  };

  const handleGrantWallet = async (e) => {
    e.preventDefault();
    if (!selectedEmployee || !grantAmount) return;

    try {
      await API.post('/organizations/wallets/topup', {
        user_id: selectedEmployee.id,
        amount: grantAmount,
        description: 'HR Corporate Food Allowance Grant',
      });
      toast.success(`Granted ₹${grantAmount} to ${selectedEmployee.name}`);
      setTopupModal(false);
      fetchOrgAdminData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to grant wallet funds');
    }
  };

  const exportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Employee Name,Email,Employee ID,Department,Wallet Balance']
        .concat(
          employees.map(
            (e) =>
              `"${e.name}","${e.email}","${e.employee_id || 'N/A'}","${e.department_name || 'General'}","${e.wallet_balance}"`
          )
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Corporate_Cafeteria_Audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Audit report exported to CSV!');
  };

  const filteredEmployees = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(searchEmployee.toLowerCase()) ||
      e.email.toLowerCase().includes(searchEmployee.toLowerCase()) ||
      (e.employee_id && e.employee_id.toLowerCase().includes(searchEmployee.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Enterprise Organization Header */}
      <div className="bg-gradient-to-r from-[#0F172A] via-[#004E89] to-[#0A2540] text-white p-6 sm:p-8 rounded-3xl shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Corporate Tenant Portal
              </span>
              <span className="text-[10px] font-bold text-orange-300">
                {orgData?.name || 'TechCorp Global'} • Code: {orgData?.code || 'TC-BLR'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Corporate Food Allowance & Cafeteria Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Configure department meal allowances, campus food courts, employee wallet credits, and monthly budget burn rate.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={exportCSV}
              className="h-10 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={() => setAddSubsidyModal(true)}
              className="h-10 px-4 rounded-xl bg-[#FF6B35] hover:bg-[#e55a28] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-orange-500/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Configure Subsidy</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Allocated Monthly Budget */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Monthly Food Budget</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">
            ₹{Number(stats.monthlyBudget || 500000).toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] font-bold text-emerald-600 mt-1">
            ₹{Number(stats.budgetRemaining || 416000).toLocaleString('en-IN')} available
          </p>
        </div>

        {/* Subsidy Dispatched */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Subsidies Utilized</span>
            <Sparkles className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#FF6B35]">
            ₹{Number(stats.subsidySpent || 84000).toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] font-semibold text-slate-400 mt-1">
            Across Breakfast & Lunch
          </p>
        </div>

        {/* Enrolled Employees */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Employees</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{stats.totalEmployees}</p>
          <p className="text-[11px] font-semibold text-slate-400 mt-1">
            {departments.length} corporate departments
          </p>
        </div>

        {/* Campus Cafeterias */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Campus Cafeterias</span>
            <Building2 className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{cafeterias.length}</p>
          <p className="text-[11px] font-semibold text-slate-400 mt-1">
            Live food courts on campus
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`h-9 px-4 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'overview' ? 'bg-[#0F172A] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Company Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('subsidies')}
          className={`h-9 px-4 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'subsidies' ? 'bg-[#0F172A] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Meal Subsidies & Policies ({subsidies.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('employees')}
          className={`h-9 px-4 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'employees' ? 'bg-[#0F172A] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Employee Wallets ({employees.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('cafeterias')}
          className={`h-9 px-4 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'cafeterias' ? 'bg-[#0F172A] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Cafeteria Locations ({cafeterias.length})
        </button>
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (8 cols): Department Allocations */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Department Food Budget Limits</h3>
                <p className="text-xs text-slate-400">Monthly meal allocations across teams</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {departments.map((d) => (
                <div key={d.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{d.name}</p>
                    <p className="text-[11px] text-slate-400">{d.member_count || 45} employees</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-slate-900 block">
                      ₹{Number(d.budget_limit).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold uppercase">Budget Cap</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column (4 cols): Active Meal Slots */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">Meal Timings & Counters</h3>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Breakfast Slot</p>
                  <p className="text-[10px] text-slate-400">07:30 AM – 11:00 AM</p>
                </div>
                <span className="font-black text-emerald-600">₹60 Subsidy</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Lunch Slot</p>
                  <p className="text-[10px] text-slate-400">12:00 PM – 03:30 PM</p>
                </div>
                <span className="font-black text-emerald-600">₹100 Subsidy</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Dinner Slot</p>
                  <p className="text-[10px] text-slate-400">07:00 PM – 10:00 PM</p>
                </div>
                <span className="font-black text-emerald-600">₹80 Subsidy</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Subsidies Policy Builder */}
      {activeTab === 'subsidies' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Corporate Subsidy Policies</h3>
              <p className="text-xs text-slate-400">Rules applied at employee checkout</p>
            </div>
            <button
              type="button"
              onClick={() => setAddSubsidyModal(true)}
              className="h-9 px-4 rounded-xl bg-[#FF6B35] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> Add Policy
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Meal Slot</th>
                  <th className="py-3 px-4">Subsidy Amount</th>
                  <th className="py-3 px-4">Coverage</th>
                  <th className="py-3 px-4">Daily Cap</th>
                  <th className="py-3 px-4">Target Department</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {subsidies.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-bold capitalize text-slate-900">{s.meal_type}</td>
                    <td className="py-3 px-4 font-black text-emerald-600">₹{s.amount}</td>
                    <td className="py-3 px-4 font-bold">{s.subsidy_percent || 100}%</td>
                    <td className="py-3 px-4">₹{s.daily_cap || 150} / day</td>
                    <td className="py-3 px-4 text-slate-600">{s.department_name || 'All Departments'}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Employee Wallets */}
      {activeTab === 'employees' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchEmployee}
                onChange={(e) => setSearchEmployee(e.target.value)}
                placeholder="Search employee by name, email, or badge ID..."
                className="w-full pl-10 pr-4 h-10 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
              />
            </div>
            <button
              type="button"
              onClick={exportCSV}
              className="h-10 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5"
            >
              <FileDown className="w-4 h-4" /> Download Audit CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Badge ID</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Food Wallet Balance</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div>
                        <span>{emp.name}</span>
                        <span className="block text-[10px] text-slate-400 font-normal">{emp.email}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{emp.employee_id || 'TC-001'}</td>
                    <td className="py-3.5 px-4 text-slate-600">{emp.department_name || 'Engineering'}</td>
                    <td className="py-3.5 px-4 font-black text-emerald-700">₹{emp.wallet_balance || 0}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedEmployee(emp);
                          setTopupModal(true);
                        }}
                        className="h-8 px-3 rounded-lg bg-orange-50 hover:bg-orange-100 text-[#FF6B35] font-bold text-[11px] transition-colors"
                      >
                        + Grant Allowance
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Cafeteria Locations */}
      {activeTab === 'cafeterias' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Campus Cafeteria Facilities</h3>
              <p className="text-xs text-slate-400">Manage cafeteria buildings, seating capacity & active food counters</p>
            </div>
            <button
              type="button"
              onClick={() => setAddCafeteriaModal(true)}
              className="h-9 px-4 rounded-xl bg-[#FF6B35] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Campus Cafeteria
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cafeterias.map((c) => (
              <div key={c.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{c.name}</h4>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">Code: {c.code}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                    Active
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 text-slate-600">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Location</span>
                    <span className="font-semibold text-slate-800">{c.location_building}, {c.floor}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Seating Capacity</span>
                    <span className="font-semibold text-slate-800">{c.capacity} Seats</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Add Cafeteria */}
      {addCafeteriaModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base">Register Campus Cafeteria</h3>
            <form onSubmit={handleCreateCafeteria} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Cafeteria Name</label>
                <input
                  type="text"
                  required
                  value={cafeteriaForm.name}
                  onChange={(e) => setCafeteriaForm({ ...cafeteriaForm, name: e.target.value })}
                  placeholder="e.g. North Tower Bistro"
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Code</label>
                  <input
                    type="text"
                    required
                    value={cafeteriaForm.code}
                    onChange={(e) => setCafeteriaForm({ ...cafeteriaForm, code: e.target.value })}
                    placeholder="TC-NTB-03"
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Capacity</label>
                  <input
                    type="number"
                    value={cafeteriaForm.capacity}
                    onChange={(e) => setCafeteriaForm({ ...cafeteriaForm, capacity: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddCafeteriaModal(false)}
                  className="h-9 px-4 rounded-xl border border-slate-200 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 rounded-xl bg-[#FF6B35] text-white font-bold"
                >
                  Create Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Grant Wallet Funds */}
      {topupModal && selectedEmployee && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base">Grant Food Allowance</h3>
            <p className="text-xs text-slate-500">
              Credit corporate food wallet for <span className="font-bold text-slate-900">{selectedEmployee.name}</span>.
            </p>
            <form onSubmit={handleGrantWallet} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Credit Amount (₹)</label>
                <input
                  type="number"
                  min="50"
                  step="50"
                  value={grantAmount}
                  onChange={(e) => setGrantAmount(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-sm font-black"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTopupModal(false)}
                  className="h-9 px-4 rounded-xl border border-slate-200 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 rounded-xl bg-emerald-600 text-white font-bold"
                >
                  Credit ₹{grantAmount}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Subsidy Policy */}
      {addSubsidyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base">Add Subsidy Rule</h3>
            <form onSubmit={handleCreateSubsidy} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Meal Slot</label>
                <select
                  value={subsidyForm.meal_type}
                  onChange={(e) => setSubsidyForm({ ...subsidyForm, meal_type: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="snack">Evening Snacks</option>
                  <option value="dinner">Dinner</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Subsidy Amount per Order (₹)</label>
                <input
                  type="number"
                  value={subsidyForm.amount}
                  onChange={(e) => setSubsidyForm({ ...subsidyForm, amount: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddSubsidyModal(false)}
                  className="h-9 px-4 rounded-xl border border-slate-200 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 rounded-xl bg-[#FF6B35] text-white font-bold"
                >
                  Save Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
