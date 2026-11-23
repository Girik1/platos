# 🍽️ Platos - Corporate Cafeteria Redefined

A full-stack, enterprise-grade digital cafeteria and food ordering platform inspired by [platos.in](https://platos.in/). Built with modern web technologies, zero external setup friction, and complete multi-role support for **Employees (Customers)**, **Food Court Vendors (Kitchen KDS)**, and **Enterprise Administrators**.

---

## 🌟 Key Features

### 1. 👤 Employee / Customer Experience
- **Interactive Menu Discovery**: Browse company cafeterias, food stalls, and categories (Breakfast, Lunch, Snacks, Beverages, Desserts).
- **Veg / Non-Veg Filtering**: Clear visual indicators (🌱 / 🔴) familiar to Indian food apps.
- **Meal Customization**: Select dish add-ons (e.g., *Extra Ghee +₹20*, *Extra Cheese +₹30*), special cooking notes, and quantity controls.
- **Corporate Subsidies**: Automatic deduction of company-sponsored meal schemes (e.g. ₹50 off breakfast, ₹100 off lunch).
- **Cashless Digital Ordering**: Simulated instant checkout via UPI, Cards, or Corporate Cafeteria Wallet.
- **Real-Time Live Order Tracking**: Visual 5-stage kitchen progress tracker (`Order Placed` ➔ `Accepted` ➔ `Preparing` ➔ `Ready for Pickup` ➔ `Picked Up`).
- **Contactless Counter Pickup**: Generates unique **4-digit Pickup OTP** and dynamic **QR Code** for instant verification at the stall.
- **One-Click Reorder & Order History**: Quickly reorder past favorite meals with one tap.

### 2. 🍳 Vendor Portal & Kitchen Display System (KDS)
- **Live Orders Queue**: Real-time incoming order dashboard with audio-visual notifications.
- **Workflow State Management**: Move orders across stages (*Accept*, *Start Cooking*, *Mark Ready*).
- **OTP Verification at Counter**: Secure handover by typing customer's 4-digit OTP or scanning QR code.
- **Menu & Stock Management**: Mark items *In Stock* or *Out of Stock* with instant toggle; add new dishes, edit pricing, prep times, and addons.

### 3. ⚡ Enterprise Admin Command Center
- **Performance Analytics**: Track cafeteria daily volume, order count, active counters, and employee enrollment.
- **Vendor Stalls Management**: Onboard new cafeteria partners, configure operating hours, and activate/deactivate stalls.
- **Employee Directory**: Manage corporate employees, company affiliations, and wallet balances.
- **Transaction Audit Log**: Comprehensive, filterable history of all orders across every vendor counter.

---

## 🔑 Demo Login Credentials

For quick testing, the app is pre-seeded with sample users. One-click demo buttons are also provided on the login screen:

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **👤 Employee (Customer)** | `user1@platos.com` | `user123` | Rahul Sharma (Infosys) - Wallet: ₹500 |
| **🍳 Vendor Counter** | `vendor1@platos.com` | `vendor123` | Annapurna Kitchen (South & North Indian) |
| **⚡ Cafeteria Admin** | `admin@platos.com` | `admin123` | Enterprise Cafeteria Manager |

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, React Router v7, Lucide Icons, React Hot Toast, Axios
- **Backend**: Node.js, Express.js, better-sqlite3 (Zero-config embedded database), JWT Auth, bcryptjs, QRCode generator
- **Portals**:
  - Customer App: `http://localhost:5173/`
  - Vendor KDS: `http://localhost:5173/vendor/dashboard`
  - Admin Panel: `http://localhost:5173/admin/dashboard`
  - Backend API: `http://localhost:5000/api`

---

## 🚀 How to Run

### Backend Server:
```bash
cd backend
npm install
npm start
# Runs on http://localhost:5000 with auto-seeded SQLite database
```

### Frontend Web App:
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

---

## 📡 API Endpoints Summary

- **Auth**: `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me`, `PUT /api/auth/me`
- **Vendors**: `GET /api/vendors`, `GET /api/vendors/:id`, `GET /api/vendors/my/current`, `POST /api/vendors`, `PUT /api/vendors/:id`
- **Menu**: `GET /api/menu/popular`, `GET /api/menu/search`, `POST /api/menu`, `PUT /api/menu/:id`, `PATCH /api/menu/:id/availability`, `DELETE /api/menu/:id`
- **Orders**: `POST /api/orders`, `GET /api/orders`, `GET /api/orders/:id`, `GET /api/orders/vendor/live`, `GET /api/orders/vendor/history`, `PATCH /api/orders/:id/status`, `POST /api/orders/:id/verify`, `POST /api/orders/:id/reorder`
- **Admin**: `GET /api/admin/dashboard`, `GET /api/admin/users`, `GET /api/admin/orders`, `GET /api/admin/analytics`
