import axios from 'axios';
import { MOCK_VENDORS, MOCK_ITEMS, MOCK_USERS } from './mockData';

// If VITE_API_BASE is set, use it; otherwise use relative /api (handled by Vite proxy locally or Vercel serverless)
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 4000,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('platos_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Standalone in-memory order store for public preview
let localOrders = [];

// Resilience Fallback Interceptor
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const { config, response } = error;
    const url = config?.url || '';
    const method = (config?.method || 'get').toLowerCase();

    // If 401 Unauthorized, handle token clearance
    if (response?.status === 401) {
      localStorage.removeItem('platos_token');
      localStorage.removeItem('platos_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // Only fallback if server returned 404, 502, 503, connection refused, or timeout
    const isNetworkOr404 =
      !response || response.status === 404 || response.status >= 500 || error.code === 'ECONNABORTED';

    if (isNetworkOr404) {
      console.warn(`[Platos Offline Engine] Fallback interceptor activated for: ${method.toUpperCase()} ${url}`);

      // 1. Menu Popular
      if (url.includes('/menu/popular')) {
        return Promise.resolve({ data: { items: MOCK_ITEMS } });
      }

      // 2. Vendors List
      if (url === '/vendors' || url.endsWith('/vendors')) {
        return Promise.resolve({ data: { vendors: MOCK_VENDORS } });
      }

      // 3. Single Vendor with Categorized Menu
      if (url.match(/\/vendors\/\d+/)) {
        const idMatch = url.match(/\/vendors\/(\d+)/);
        const vendorId = idMatch ? parseInt(idMatch[1], 10) : 1;
        const vendor = MOCK_VENDORS.find(v => v.id === vendorId) || MOCK_VENDORS[0];
        const vendorItems = MOCK_ITEMS.filter(i => i.vendor_id === vendor.id);

        // Group into categories
        const catMap = {};
        vendorItems.forEach(item => {
          if (!catMap[item.category_id]) {
            catMap[item.category_id] = {
              id: item.category_id,
              name: item.category_name,
              items: [],
            };
          }
          catMap[item.category_id].items.push(item);
        });

        return Promise.resolve({
          data: {
            vendor,
            menu: Object.values(catMap),
          },
        });
      }

      // 4. Vendor My Current
      if (url.includes('/vendors/my/current')) {
        return Promise.resolve({ data: { vendor: MOCK_VENDORS[0] } });
      }

      // 5. Subsidy Quote
      if (url.includes('/orders/subsidy-quote')) {
        const currentUser = JSON.parse(localStorage.getItem('platos_user') || '{}');
        const company = currentUser.company || 'TechCorp';
        return Promise.resolve({
          data: {
            eligible: true,
            company: company,
            mealType: 'lunch',
            amount: 100,
          },
        });
      }

      // 6. Auth Login
      if (url.includes('/auth/login') && method === 'post') {
        const body = JSON.parse(config.data || '{}');
        const email = (body.email || '').toLowerCase().trim();
        const user = MOCK_USERS[email] || {
          id: 99,
          name: email.split('@')[0] || 'Employee',
          email,
          role: email.includes('admin') ? 'admin' : email.includes('vendor') ? 'vendor' : 'customer',
          company: 'TechCorp',
          wallet_balance: 500,
        };

        const token = `demo_jwt_token_${Date.now()}`;
        return Promise.resolve({
          data: {
            token,
            user,
          },
        });
      }

      // 7. Auth Me
      if (url.includes('/auth/me')) {
        const saved = localStorage.getItem('platos_user');
        const user = saved ? JSON.parse(saved) : MOCK_USERS['user1@platos.com'];
        return Promise.resolve({ data: { user } });
      }

      // 8. Place Order
      if (url === '/orders' && method === 'post') {
        const body = JSON.parse(config.data || '{}');
        const clientItems = body.items || [];
        const subtotal = clientItems.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0);
        const subsidy = Math.min(100, subtotal);
        const orderNumber = `PLTS-${Math.floor(1000 + Math.random() * 9000)}`;
        const otp = String(Math.floor(1000 + Math.random() * 9000));

        const newOrder = {
          id: Date.now(),
          order_number: orderNumber,
          user_id: 4,
          vendor_id: 1,
          vendor_name: 'Annapurna Kitchen',
          total_amount: subtotal,
          subsidy_amount: subsidy,
          payment_method: body.payment_method || 'wallet',
          payment_status: 'paid',
          pickup_otp: otp,
          status: 'placed',
          qr_code: 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=' + encodeURIComponent(JSON.stringify({ orderNumber, otp })),
          special_instructions: body.special_instructions || '',
          created_at: new Date().toISOString(),
          items: clientItems.map(i => ({
            item_name: i.name,
            item_price: i.price,
            quantity: i.quantity,
            addons_json: JSON.stringify(i.addons || []),
          })),
        };

        localOrders.unshift(newOrder);
        return Promise.resolve({ data: { order: newOrder } });
      }

      // 9. Get Single Order Detail
      if (url.match(/\/orders\/\d+/)) {
        const idMatch = url.match(/\/orders\/(\d+)/);
        const orderId = idMatch ? parseInt(idMatch[1], 10) : 0;
        const found = localOrders.find(o => o.id === orderId) || localOrders[0];

        if (found) {
          return Promise.resolve({ data: { order: found } });
        }

        // Return a mock active order if not in local array
        const defaultOrder = {
          id: orderId || 101,
          order_number: `PLTS-${orderId || 4821}`,
          vendor_id: 1,
          vendor_name: 'Annapurna Kitchen',
          total_amount: 140,
          subsidy_amount: 50,
          payment_method: 'wallet',
          pickup_otp: '7392',
          status: 'preparing',
          qr_code: 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=PLTS-4821',
          created_at: new Date().toISOString(),
          items: [
            { item_name: 'Masala Dosa', item_price: 80, quantity: 1, addons_json: '[]' },
            { item_name: 'Gulab Jamun (2 pcs)', item_price: 60, quantity: 1, addons_json: '[]' },
          ],
        };
        return Promise.resolve({ data: { order: defaultOrder } });
      }

      // 10. Orders List
      if (url === '/orders' || url.endsWith('/orders')) {
        return Promise.resolve({ data: { orders: localOrders } });
      }

      // 11. Admin & Vendor Live Orders
      if (url.includes('/orders/vendor/live')) {
        return Promise.resolve({ data: { orders: localOrders } });
      }

      // 12. Admin Dashboard Stats
      if (url.includes('/admin/dashboard')) {
        return Promise.resolve({
          data: {
            stats: {
              totalOrders: 148,
              totalRevenue: 34250,
              totalUsers: 840,
              totalVendors: 2,
              todayOrders: 42,
              todayRevenue: 8940,
            },
          },
        });
      }
    }

    return Promise.reject(error);
  }
);

export default API;
