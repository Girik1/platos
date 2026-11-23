import { useState, useEffect } from 'react';
import {
  Wallet,
  Building2,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  RefreshCw,
  QrCode,
  Plus,
} from 'lucide-react';
import API from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function WalletPage() {
  const { user, updateWalletBalance } = useAuth();
  const [balance, setBalance] = useState(user?.wallet_balance || 500);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Top Up Modal
  const [topupModal, setTopupModal] = useState(false);
  const [amount, setAmount] = useState(250);
  const [upiMethod, setUpiMethod] = useState('gpay');
  const [reloading, setReloading] = useState(false);

  useEffect(() => {
    fetchWalletLedger();
  }, []);

  const fetchWalletLedger = async () => {
    try {
      setLoading(true);
      const res = await API.get('/finance/wallet/transactions');
      if (res.data?.balance !== undefined) {
        setBalance(res.data.balance);
        if (updateWalletBalance) updateWalletBalance(res.data.balance);
      }
      if (res.data?.transactions) setTransactions(res.data.transactions);
    } catch (_) {
      // offline fallback
    } finally {
      setLoading(false);
    }
  };

  const handleTopup = async (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;

    try {
      setReloading(true);
      const res = await API.post('/finance/wallet/topup', {
        amount,
        payment_method: upiMethod.toUpperCase(),
      });
      const nextBal = res.data?.newBalance !== undefined ? Number(res.data.newBalance) : balance + Number(amount);
      setBalance(nextBal);
      if (updateWalletBalance) updateWalletBalance(nextBal);
      toast.success(`Successfully added ₹${amount} via UPI!`);
      setTopupModal(false);
      fetchWalletLedger();
    } catch (_) {
      toast.error('Failed to process topup');
    } finally {
      setReloading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Wallet Balance Hero Card */}
      <div className="bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#004E89] text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-44 h-44 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> 100% Cashless Campus Wallet
              </span>
              <span className="text-[10px] font-bold text-orange-300">
                {user?.company || 'TechCorp Global'}
              </span>
            </div>

            <p className="text-xs uppercase tracking-wider text-slate-300 font-bold">
              Available Cafeteria Balance
            </p>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight mt-1 text-white">
              ₹{Number(balance).toFixed(0)}
            </h1>

            <div className="flex items-center gap-4 mt-4 text-xs text-slate-300 font-medium">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Employer Meal Subsidies Active
              </span>
              <span>•</span>
              <span className="font-mono text-slate-400">Badge ID: {user?.employee_id || 'TC-ENG-482'}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setTopupModal(true)}
              className="h-12 px-6 rounded-2xl bg-[#FF6B35] hover:bg-[#e55a28] text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Money (UPI)</span>
            </button>
            <p className="text-[11px] text-slate-400 text-center">
              Auto-redeems on breakfast & lunch
            </p>
          </div>
        </div>
      </div>

      {/* Corporate Subsidy Policy Banner */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#FF6B35] flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">
              Employer Meal Subsidy: Up to -₹100 per meal
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Provided by {user?.company || 'TechCorp Global'} at campus counters. Deducted automatically at checkout.
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-black uppercase">
          Enabled
        </span>
      </div>

      {/* Transaction History Ledger */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Wallet Transaction History</h3>
            <p className="text-xs text-slate-400">All cafeteria meal purchases, subsidies & recharges</p>
          </div>
          <button
            type="button"
            onClick={fetchWalletLedger}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No transactions found in this billing period.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {transactions.map((tx) => {
              const isCredit = tx.amount > 0 || tx.type.startsWith('credit');
              return (
                <div key={tx.id} className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        isCredit
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {isCredit ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{tx.description}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        Ref: {tx.reference_id || 'CR-001'} • {new Date(tx.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-sm font-black tabular-nums block ${
                        isCredit ? 'text-emerald-600' : 'text-slate-900'
                      }`}
                    >
                      {isCredit ? '+' : ''}₹{Math.abs(tx.amount).toFixed(0)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Balance: ₹{Number(tx.balance_after || balance).toFixed(0)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Top Up Modal */}
      {topupModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">Top Up Food Wallet</h3>
              <button
                type="button"
                onClick={() => setTopupModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleTopup} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-2 uppercase tracking-wider">
                  Select Amount (₹)
                </label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[100, 250, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAmount(amt)}
                      className={`h-10 rounded-xl font-black text-xs transition-all ${
                        amount === amt
                          ? 'bg-[#FF6B35] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="50"
                  step="50"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 font-black text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-2 uppercase tracking-wider">
                  Instant UPI Gateway
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'gpay', name: 'Google Pay' },
                    { id: 'phonepe', name: 'PhonePe' },
                    { id: 'paytm', name: 'Paytm / UPI' },
                  ].map((gateway) => (
                    <button
                      key={gateway.id}
                      type="button"
                      onClick={() => setUpiMethod(gateway.id)}
                      className={`p-2.5 rounded-xl border text-center font-bold text-[11px] transition-all ${
                        upiMethod === gateway.id
                          ? 'border-[#FF6B35] bg-orange-50 text-orange-950 shadow-xs'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {gateway.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTopupModal(false)}
                  className="h-10 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reloading}
                  className="h-10 px-5 rounded-xl bg-[#FF6B35] hover:bg-[#e55a28] text-white font-bold uppercase tracking-wider shadow-md shadow-orange-500/25"
                >
                  {reloading ? 'Processing...' : `Pay ₹${amount}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
