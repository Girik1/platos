import axios from 'axios';
import {
  MOCK_VENDORS,
  MOCK_ITEMS,
  MOCK_USERS,
  MOCK_ORGANIZATIONS,
  MOCK_CAFETERIAS,
  MOCK_DEPARTMENTS,
  MOCK_SUBSIDIES,
  MOCK_SETTLEMENTS,
  MOCK_INVENTORY,
} from './mockData';

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

      // 13. Super Admin Endpoints
      if (url.includes('/superadmin/dashboard')) {
        return Promise.resolve({
          data: {
            metrics: {
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
            },
            recentOrgs: MOCK_ORGANIZATIONS,
            pendingVendors: [],
            recentActivity: localOrders.slice(0, 5),
          },
        });
      }

      if (url.includes('/superadmin/organizations')) {
        return Promise.resolve({ data: { organizations: MOCK_ORGANIZATIONS } });
      }

      if (url.includes('/superadmin/vendors')) {
        return Promise.resolve({ data: { vendors: MOCK_VENDORS } });
      }

      // 14. Cafeterias Endpoints
      if (url.includes('/cafeterias')) {
        return Promise.resolve({ data: { cafeterias: MOCK_CAFETERIAS } });
      }

      // 15. Organization Admin Endpoints
      if (url.includes('/organizations/current')) {
        return Promise.resolve({
          data: {
            organization: MOCK_ORGANIZATIONS[0],
            stats: {
              totalEmployees: 840,
              totalCafeterias: 2,
              monthlyBudget: 500000,
              totalSpentThisMonth: 342500,
              subsidySpent: 84000,
              budgetRemaining: 416000,
            },
          },
        });
      }

      if (url.includes('/organizations/cafeterias')) {
        return Promise.resolve({ data: { cafeterias: MOCK_CAFETERIAS.slice(0, 2) } });
      }

      if (url.includes('/organizations/departments')) {
        return Promise.resolve({ data: { departments: MOCK_DEPARTMENTS } });
      }

      if (url.includes('/organizations/subsidies')) {
        return Promise.resolve({ data: { subsidies: MOCK_SUBSIDIES } });
      }

      if (url.includes('/organizations/employees')) {
        return Promise.resolve({
          data: {
            employees: [
              { id: 4, name: 'Rahul Sharma', email: 'user1@platos.com', employee_id: 'TC-ENG-482', department_name: 'Engineering & Tech', wallet_balance: 500, created_at: '2026-11-15' },
              { id: 5, name: 'Priya Patel', email: 'user2@platos.com', employee_id: 'TC-PRD-204', department_name: 'Product & Design', wallet_balance: 750, created_at: '2026-11-15' },
              { id: 6, name: 'Amit Kumar', email: 'user3@platos.com', employee_id: 'TC-SLS-311', department_name: 'Sales & Enterprise Relations', wallet_balance: 300, created_at: '2026-11-15' },
            ],
          },
        });
      }

      // 16. Kitchen POS KDS Endpoints
      if (url.includes('/kitchen/orders/live')) {
        return Promise.resolve({
          data: {
            orders: localOrders.filter(o => ['placed', 'accepted', 'preparing', 'ready'].includes(o.status)),
            counts: {
              placed: localOrders.filter(o => o.status === 'placed').length,
              preparing: localOrders.filter(o => ['accepted', 'preparing'].includes(o.status)).length,
              ready: localOrders.filter(o => o.status === 'ready').length,
              totalLive: localOrders.length,
            },
          },
        });
      }

      if (url.includes('/kitchen/inventory')) {
        return Promise.resolve({ data: { inventory: MOCK_INVENTORY } });
      }

      if (url.includes('/kitchen/verify-pickup')) {
        return Promise.resolve({
          data: {
            success: true,
            message: 'Order verified and handed over successfully!',
          },
        });
      }

      // 17. Finance & Settlements
      if (url.includes('/finance/wallet/transactions')) {
        return Promise.resolve({
          data: {
            balance: 500,
            transactions: [
              { id: 1, amount: 500, type: 'credit_subsidy', balance_after: 500, description: 'Monthly Corporate Meal Allowance', reference_id: 'CR-SUB-101', created_at: '2026-11-01' },
              { id: 2, amount: -120, type: 'debit_order', balance_after: 380, description: 'Dosa & Filter Coffee at Annapurna Kitchen', reference_id: 'TX-ORD-902', created_at: '2026-11-10' },
              { id: 3, amount: 240, type: 'credit_self', balance_after: 620, description: 'UPI Wallet Top-up (GPay)', reference_id: 'PG-UPI-849', created_at: '2026-11-18' },
            ],
          },
        });
      }

      if (url.includes('/finance/settlements')) {
        return Promise.resolve({
          data: {
            settlements: MOCK_SETTLEMENTS,
            totals: { grossSales: 195100, totalCommission: 9755, totalPayout: 185345 },
          },
        });
      }
    }

    return Promise.reject(error);
  }
);

export default API;
