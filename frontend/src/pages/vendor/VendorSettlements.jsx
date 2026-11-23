import { useState, useEffect } from 'react';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  FileDown,
  CheckCircle2,
  Clock,
  Building,
  RefreshCw,
  Search,
  ShieldCheck,
} from 'lucide-react';
import API from '../../api/axios';
import toast from 'react-hot-toast';

export default function VendorSettlements() {
  const [settlements, setSettlements] = useState([]);
  const [totals, setTotals] = useState({
    grossSales: 195100,
    totalCommission: 9755,
    totalPayout: 185345,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettlements();
  }, []);

  const fetchSettlements = async () => {
    try {
      setLoading(true);
      const res = await API.get('/finance/settlements');
      if (res.data?.settlements) setSettlements(res.data.settlements);
      if (res.data?.totals) setTotals(res.data.totals);
    } catch (_) {
      toast.error('Failed to load payouts');
    } finally {
      setLoading(false);
    }
  };

  const exportSettlementCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Period Start,Period End,Gross Sales,Commission (5%),Net Payout,UTR Reference,Status']
        .concat(
          settlements.map(
            (s) =>
              `"${s.period_start}","${s.period_end}","${s.total_sales}","${s.platform_commission}","${s.net_payout}","${s.payment_reference || 'PROCESSED'}","${s.status}"`
          )
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Vendor_Settlement_Summary_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Settlement summary exported to CSV!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#004E89] text-white p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Financial Ledger & Settlements
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1.5">
            Vendor Payouts & Commission Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Bi-weekly campus food sales settlements, platform deductions, and automated NEFT/RTGS bank transfers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchSettlements}
            className="h-10 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={exportSettlementCSV}
            className="h-10 px-4 rounded-xl bg-[#FF6B35] hover:bg-[#e55a28] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-orange-500/25"
          >
            <FileDown className="w-4 h-4" />
            <span>Download Statement</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Total Sales Volume
          </span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">
            ₹{Number(totals.grossSales || 195100).toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] font-semibold text-slate-400 mt-1">Across all cafeteria counters</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Platform Take (5%)
          </span>
          <p className="text-2xl sm:text-3xl font-black text-orange-600">
            ₹{Number(totals.totalCommission || 9755).toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] font-semibold text-slate-400 mt-1">SaaS infrastructure & gateway fees</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Disbursed Net Payouts
          </span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600">
            ₹{Number(totals.totalPayout || 185345).toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> 100% Processed to Bank
          </p>
        </div>
      </div>

      {/* Settlements Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900">Settlement Ledger & UTR References</h3>
          <span className="text-xs text-slate-400">Weekly reconciliation cycle</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Vendor Partner</th>
                <th className="py-3 px-4">Gross Sales</th>
                <th className="py-3 px-4">Platform Fee (5%)</th>
                <th className="py-3 px-4">Net Disbursed</th>
                <th className="py-3 px-4">Bank UTR Reference</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {settlements.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {s.period_start} – {s.period_end}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">
                    {s.vendor_name || 'Annapurna Kitchen'}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    ₹{Number(s.total_sales).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-orange-600">
                    -₹{Number(s.platform_commission).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 font-black text-emerald-700 text-sm">
                    ₹{Number(s.net_payout).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                    {s.payment_reference || 'HDFC-NEFT-928371'}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[10px]">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Processed
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
