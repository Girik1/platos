import { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  Sparkles,
  Clock,
  Tag
} from 'lucide-react';
import API from '../../api/axios';
import toast from 'react-hot-toast';

export default function VendorMenu() {
  const [vendor, setVendor] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [form, setForm] = useState({
    name: '',
    category_id: 1,
    description: '',
    price: '',
    is_veg: 1,
    prep_time: 15,
    is_bestseller: 0,
    addons: [{ name: '', price: '' }],
  });

  useEffect(() => {
    fetchVendorAndMenu();
  }, []);

  const fetchVendorAndMenu = async () => {
    try {
      setLoading(true);
      const vRes = await API.get('/vendors/my/current');
      const v = vRes.data?.vendor;
      setVendor(v);

      if (v?.id) {
        const mRes = await API.get(`/vendors/${v.id}`);
        setMenu(mRes.data?.menu || []);
        if (mRes.data?.menu?.length > 0 && mRes.data.menu[0].id) {
          setForm((prev) => ({ ...prev, category_id: mRes.data.menu[0].id }));
        }
      }
    } catch (err) {
      toast.error('Failed to load menu.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async (itemId) => {
    try {
      await API.patch(`/menu/${itemId}/availability`);
      toast.success('Availability updated!');
      fetchVendorAndMenu();
    } catch (err) {
      toast.error('Failed to toggle availability.');
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;
    try {
      await API.delete(`/menu/${itemId}`);
      toast.success('Item removed from menu.');
      fetchVendorAndMenu();
    } catch (err) {
      toast.error('Failed to delete item.');
    }
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setForm({
      name: '',
      category_id: menu[0]?.id || 1,
      description: '',
      price: '',
      is_veg: 1,
      prep_time: 15,
      is_bestseller: 0,
      addons: [{ name: '', price: '' }],
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      category_id: item.category_id || menu[0]?.id || 1,
      description: item.description || '',
      price: item.price,
      is_veg: item.is_veg,
      prep_time: item.prep_time || 15,
      is_bestseller: item.is_bestseller || 0,
      addons: item.addons?.length > 0 ? item.addons : [{ name: '', price: '' }],
    });
    setModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      toast.error('Please provide item name and price.');
      return;
    }

    try {
      const cleanAddons = form.addons.filter((a) => a.name.trim() && a.price !== '');

      if (editingItem) {
        await API.put(`/menu/${editingItem.id}`, {
          ...form,
          price: Number(form.price),
        });
        toast.success('Item updated successfully!');
      } else {
        await API.post('/menu', {
          ...form,
          vendor_id: vendor.id,
          price: Number(form.price),
          addons: cleanAddons.map((a) => ({ name: a.name, price: Number(a.price) })),
        });
        toast.success('New item added to cafeteria menu!');
      }

      setModalOpen(false);
      fetchVendorAndMenu();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save item.');
    }
  };

  const allItems = menu.flatMap((c) => c.items || []);
  const filteredItems = allItems.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <UtensilsCrossed className="w-6 h-6 text-[#FF6B35]" /> Cafeteria Menu Management
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              {vendor?.name || 'Your Counter'} • Update daily dish availability, pricing & prep times
            </p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="px-5 py-2.5 bg-[#FF6B35] hover:bg-[#e55a28] text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Add Menu Item
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items by name or description..."
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
          />
        </div>

        {/* Menu Items Table / Grid */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-3 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center text-gray-400 border border-gray-200">
            <p className="text-sm font-medium">No menu items found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
            <div className="divide-y divide-gray-100">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                    !item.is_available ? 'bg-gray-50/60 opacity-70' : 'hover:bg-gray-50/40'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <span
                      className={`w-3.5 h-3.5 rounded-full mt-1 shrink-0 ${
                        item.is_veg ? 'bg-emerald-500 ring-2 ring-emerald-200' : 'bg-red-500 ring-2 ring-red-200'
                      }`}
                      title={item.is_veg ? 'Vegetarian' : 'Non-Vegetarian'}
                    />

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-900 text-sm">{item.name}</h4>
                        {item.is_bestseller ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            ★ Bestseller
                          </span>
                        ) : null}
                        {!item.is_available && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                            Out of Stock
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.description}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                        <span className="font-bold text-gray-900 text-sm">₹{item.price}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {item.prep_time || 15} mins prep
                        </span>
                        {item.addons?.length > 0 && (
                          <>
                            <span>•</span>
                            <span>{item.addons.length} Addons available</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2.5 self-end sm:self-auto">
                    {/* In Stock toggle */}
                    <button
                      onClick={() => handleToggleAvailability(item.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        item.is_available
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {item.is_available ? '● In Stock' : '○ Out of Stock'}
                    </button>

                    <button
                      onClick={() => handleOpenEditModal(item)}
                      className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit Item"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add/Edit Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
                <h3 className="font-bold text-gray-900 text-base">
                  {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Dish Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Masala Dosa"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#FF6B35]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      placeholder="80"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#FF6B35]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Prep Time (mins)
                    </label>
                    <input
                      type="number"
                      value={form.prep_time}
                      onChange={(e) => setForm({ ...form, prep_time: e.target.value })}
                      placeholder="15"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#FF6B35]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Category
                  </label>
                  <select
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#FF6B35]"
                  >
                    {menu.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Description
                  </label>
                  <textarea
                    rows="2"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Crispy golden crepe served with sambar and coconut chutney..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#FF6B35]"
                  />
                </div>

                <div className="flex items-center gap-6 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.is_veg === 1}
                      onChange={(e) => setForm({ ...form, is_veg: e.target.checked ? 1 : 0 })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span>🌱 Vegetarian Dish</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.is_bestseller === 1}
                      onChange={(e) => setForm({ ...form, is_bestseller: e.target.checked ? 1 : 0 })}
                      className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4"
                    />
                    <span>★ Mark as Bestseller</span>
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#FF6B35] text-white rounded-xl text-xs font-semibold hover:bg-[#e55a28]"
                  >
                    {editingItem ? 'Update Dish' : 'Add to Menu'}
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