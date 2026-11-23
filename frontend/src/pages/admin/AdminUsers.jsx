import { useState, useEffect } from 'react';
import { Users, Search, Building, Wallet, Shield, Phone, Mail } from 'lucide-react';
import API from '../../api/axios';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await API.get('/admin/users');
      setUsers(res.data?.users || []);
    } catch (err) {
      toast.error('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.company && u.company.toLowerCase().includes(search.toLowerCase()));

    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-[#004E89]" /> Corporate Employee & Staff Directory
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Manage enterprise cafeteria accounts, roles, company affiliations & wallet balances
            </p>
          </div>

          <div className="text-xs text-gray-400">Total Enrolled: {users.length}</div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or company..."
              className="w-full pl-11 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#004E89]"
            />
          </div>

          <div className="flex gap-1.5 w-full sm:w-auto">
            {['all', 'customer', 'vendor', 'admin'].map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                  roleFilter === role
                    ? 'bg-[#004E89] text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-20 flex justify-center">
              <div className="w-8 h-8 border-3 border-[#004E89] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400">No users match your criteria.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-400 uppercase font-semibold">
                    <th className="py-3.5 px-4">User</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Company</th>
                    <th className="py-3.5 px-4">Wallet Balance</th>
                    <th className="py-3.5 px-4">Joined Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {filteredUsers.map((u) => {
                    const roleBadge = {
                      admin: 'bg-purple-100 text-purple-800',
                      vendor: 'bg-orange-100 text-[#FF6B35]',
                      customer: 'bg-blue-100 text-[#004E89]',
                    }[u.role] || 'bg-gray-100 text-gray-700';

                    return (
                      <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#004E89] to-[#FF6B35] text-white flex items-center justify-center font-bold text-xs shrink-0">
                              {u.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-sm">{u.name}</p>
                              <p className="text-[11px] text-gray-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${roleBadge}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-gray-800">{u.company || '—'}</td>
                        <td className="py-3.5 px-4 font-bold text-emerald-600">
                          ₹{Number(u.wallet_balance || 0).toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-gray-400">
                          {new Date(u.created_at).toLocaleDateString('en-IN', {
                            dateStyle: 'medium',
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}