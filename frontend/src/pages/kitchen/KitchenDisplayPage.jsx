import { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  BellRing,
  AlertCircle,
  Volume2,
  VolumeX,
  RefreshCw,
  QrCode,
  KeyRound,
  PackageCheck,
  ChefHat,
  Search,
  Check,
  Flame,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import API from '../../api/axios';
import toast from 'react-hot-toast';

export default function KitchenDisplayPage() {
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [counts, setCounts] = useState({ placed: 0, preparing: 0, ready: 0, totalLive: 0 });
  const [loading, setLoading] = useState(true);
  const [audioAlert, setAudioAlert] = useState(true);

  // OTP Handover Modal
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifiedOrderResult, setVerifiedOrderResult] = useState(null);

  // Quick bump loading indicator per order ID
  const [bumpingId, setBumpingId] = useState(null);

  useEffect(() => {
    fetchKitchenQueue();
    const interval = setInterval(fetchKitchenQueue, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchKitchenQueue = async () => {
    try {
      const [queueRes, invRes] = await Promise.all([
        API.get('/kitchen/orders/live').catch(() => ({ data: { orders: [], counts: {} } })),
        API.get('/kitchen/inventory').catch(() => ({ data: { inventory: [] } })),
      ]);

      if (queueRes.data?.orders) setOrders(queueRes.data.orders);
      if (queueRes.data?.counts) setCounts(queueRes.data.counts);
      if (invRes.data?.inventory) setInventory(invRes.data.inventory);
    } catch (_) {
      // offline fallback handles it
    } finally {
      setLoading(false);
    }
  };

  const handleBumpOrder = async (orderId) => {
    try {
      setBumpingId(orderId);
      const res = await API.post(`/kitchen/orders/${orderId}/bump`);
      const nextStatus = res.data?.currentStatus || 'updated';
      toast.success(`Order bumped to ${nextStatus.toUpperCase()}`);
      fetchKitchenQueue();
    } catch (_) {
      toast.error('Failed to bump order');
    } finally {
      setBumpingId(null);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpInput || otpInput.trim().length < 4) {
      toast.error('Please enter 4-digit pickup OTP');
      return;
    }

    try {
      setVerifying(true);
      const res = await API.post('/kitchen/verify-pickup', { otp: otpInput.trim() });
      setVerifiedOrderResult(res.data?.order);
      toast.success(res.data?.message || 'Order Verified & Collected!');
      setOtpInput('');
      fetchKitchenQueue();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid OTP or Order already collected');
    } finally {
      setVerifying(false);
    }
  };

  const toggleInventoryStock = async (item) => {
    const nextStatus = item.status === 'in_stock' ? 'low_stock' : item.status === 'low_stock' ? 'out_of_stock' : 'in_stock';
    try {
      await API.patch(`/kitchen/inventory/${item.id}`, { status: nextStatus });
      toast.success(`${item.item_name} marked as ${nextStatus.replace('_', ' ').toUpperCase()}`);
      fetchKitchenQueue();
    } catch (_) {
      toast.error('Failed to update inventory');
    }
  };

  return (
    <div className="space-y-6">
      {/* High-Speed KDS Top Control Console */}
      <div className="bg-[#0F172A] text-white p-5 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF6B35] to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/25">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight">Live Kitchen POS & KDS</h1>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Sync 5s
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Rapid touchscreen station for kitchen chefs, order prep queue & counter collection verification.
            </p>
          </div>
        </div>

        {/* Live Status KPI Badges & Quick Handover Button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Counts */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl p-1.5 text-xs font-bold">
            <span className="px-2.5 py-1 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
              {counts.placed} New
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              {counts.preparing} Cooking
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {counts.ready} Ready
            </span>
          </div>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => {
              setAudioAlert(!audioAlert);
              toast(audioAlert ? 'Order audio mute' : 'Order chimes enabled 🔔');
            }}
            className={`h-11 px-3 rounded-2xl border flex items-center gap-1.5 text-xs font-bold transition-colors ${
              audioAlert
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
            title="Audio alerts on incoming orders"
          >
            {audioAlert ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">Chime</span>
          </button>

          {/* Handover OTP Button */}
          <button
            type="button"
            onClick={() => {
              setVerifiedOrderResult(null);
              setVerifyModalOpen(true);
            }}
            className="h-11 px-5 rounded-2xl bg-[#FF6B35] hover:bg-[#e55a28] text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-orange-500/30 transition-all cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
            <span>Verify Handover (OTP)</span>
          </button>
        </div>
      </div>

      {/* Main Order Queue Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Kitchen Preparation Queue ({orders.length})</span>
          </h2>
          <span className="text-xs text-slate-400">Sorted by order age & priority</span>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center shadow-xs">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">Kitchen Counter Clear!</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              No orders currently pending preparation. Newly placed customer orders will appear instantly with live audio chime.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map((ord) => {
              const isNew = ord.status === 'placed';
              const isCooking = ord.status === 'accepted' || ord.status === 'preparing';
              const isReady = ord.status === 'ready';

              return (
                <div
                  key={ord.id}
                  className={`flex flex-col bg-white rounded-3xl border-2 transition-all shadow-sm overflow-hidden ${
                    isNew
                      ? 'border-orange-400 ring-4 ring-orange-500/10'
                      : isCooking
                      ? 'border-blue-400'
                      : 'border-emerald-400'
                  }`}
                >
                  {/* Card Header */}
                  <div
                    className={`p-4 flex items-center justify-between text-white ${
                      isNew ? 'bg-orange-600' : isCooking ? 'bg-blue-600' : 'bg-emerald-600'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider opacity-80 block">
                        Order #{ord.order_number}
                      </span>
                      <p className="text-base font-black tracking-tight">{ord.customer_name}</p>
                    </div>

                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs">
                        <Clock className="w-3 h-3" />
                        {isNew ? 'NEW ORDER' : isCooking ? 'IN KITCHEN' : 'READY FOR PICKUP'}
                      </span>
                      {ord.pickup_otp && isReady && (
                        <p className="text-xs font-mono font-black mt-1 text-white">
                          OTP: {ord.pickup_otp}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="p-4 flex-1 space-y-3 bg-white">
                    <div className="space-y-2 divide-y divide-slate-100">
                      {(ord.items || []).map((item, idx) => (
                        <div key={idx} className="pt-2 first:pt-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-black text-slate-900">
                              {item.quantity}x {item.item_name}
                            </span>
                            <span className="text-xs font-bold text-slate-500">
                              ₹{item.item_price * item.quantity}
                            </span>
                          </div>
                          {item.addons && item.addons.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.addons.map((ad, aIdx) => (
                                <span
                                  key={aIdx}
                                  className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700"
                                >
                                  +{ad.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Special Instructions Alert */}
                    {ord.special_instructions && (
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
                        ⚠️ Note: "{ord.special_instructions}"
                      </div>
                    )}
                  </div>

                  {/* 1-Click Action Stepper Button */}
                  <div className="p-3 bg-slate-50 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={bumpingId === ord.id}
                      onClick={() => handleBumpOrder(ord.id)}
                      className={`w-full h-12 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] ${
                        isNew
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25'
                          : isCooking
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/25'
                          : 'bg-slate-900 hover:bg-black text-white shadow-slate-900/25'
                      }`}
                    >
                      {isNew ? (
                        <>
                          <ChefHat className="w-4 h-4" />
                          <span>Accept & Start Prep →</span>
                        </>
                      ) : isCooking ? (
                        <>
                          <BellRing className="w-4 h-4" />
                          <span>Mark Ready For Pickup →</span>
                        </>
                      ) : (
                        <>
                          <PackageCheck className="w-4 h-4" />
                          <span>Complete & Handed Over ✓</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Kitchen Inventory Stock Quick Monitor */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Live Kitchen Inventory Toggles</h3>
            <p className="text-xs text-slate-400">1-click toggle to trigger low stock warnings and 86 items on campus menus</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {inventory.map((inv) => (
            <div
              key={inv.id}
              onClick={() => toggleInventoryStock(inv)}
              className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-all cursor-pointer flex items-center justify-between group"
            >
              <div>
                <p className="text-xs font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                  {inv.item_name}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Stock: <span className="font-bold text-slate-700">{inv.current_stock} {inv.unit}</span>
                </p>
              </div>

              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                  inv.status === 'in_stock'
                    ? 'bg-emerald-100 text-emerald-800'
                    : inv.status === 'low_stock'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {inv.status.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Handover OTP Verification Modal */}
      {verifyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#FF6B35]" />
                <h3 className="font-extrabold text-slate-900 text-base">Verify Customer OTP</h3>
              </div>
              <button
                type="button"
                onClick={() => setVerifyModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {verifiedOrderResult ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <p className="font-black text-emerald-900 text-base">OTP Verified Successfully!</p>
                <p className="text-xs text-emerald-700">
                  Order #{verifiedOrderResult.order_number} marked as <span className="font-bold">Picked Up</span>.
                </p>
                <button
                  type="button"
                  onClick={() => setVerifiedOrderResult(null)}
                  className="mt-2 h-9 px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                >
                  Verify Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Enter 4-Digit Pickup PIN
                  </label>
                  <input
                    type="text"
                    autoFocus
                    maxLength={4}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    placeholder="e.g. 7392"
                    className="w-full h-14 text-center font-mono text-3xl font-black tracking-widest rounded-2xl border-2 border-slate-200 focus:border-[#FF6B35] focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 text-center mt-1.5">
                    Ask customer for the OTP displayed on their order screen
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setVerifyModalOpen(false)}
                    className="h-10 px-4 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={verifying}
                    className="h-10 px-5 rounded-xl bg-[#FF6B35] hover:bg-[#e55a28] text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-orange-500/25"
                  >
                    {verifying ? 'Verifying...' : 'Confirm Handover'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
