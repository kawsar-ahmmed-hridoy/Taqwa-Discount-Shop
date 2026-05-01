# Taqwa - Discount Shop POS System

A comprehensive, enterprise-grade Point of Sale (POS) system designed for discount retail shops with multi-role access control, real-time inventory management, billing automation, and advanced analytics.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Role-Based Access Control](#role-based-access-control)
- [Development Guidelines](#development-guidelines)
- [Troubleshooting](#troubleshooting)

---

## ✨ Features

### Authentication & Authorization
- **Multi-role Access Control**: Owner, Manager, and Staff roles with granular permissions
- **JWT Authentication**: Secure token-based authentication with configurable expiry
- **Password Security**: bcrypt-based password hashing with salt rounds
- **Profile Management**: User profile updates and password reset functionality
- **Login/Logout**: Secure session management with automatic token refresh

### Point of Sale (POS)
- **Barcode Scanning**: Real-time product lookup via html5-qrcode
- **Shopping Cart**: Dynamic cart management with quantity adjustments
- **VAT Calculation**: Automatic tax calculation (customizable rates)
- **Multiple Payment Modes**: Cash, Card, and UPI payment options
- **Order Status Tracking**: Pending, Delivered, and Cancelled states
- **Transaction History**: Complete billing records with timestamps

### Inventory Management
- **Product Management**: Add, update, delete products with SKU tracking
- **Stock Tracking**: Real-time inventory updates after each sale
- **Low Stock Alerts**: Automatic notifications when stock falls below threshold
- **Product Categories**: Organized product catalog with filtering
- **Barcode Support**: Unique barcode assignments for each product
- **Expiry Monitoring**: Track and alert on approaching expiry dates

### Supplier & Purchase Orders
- **Supplier Management**: Maintain supplier contact information and payment terms
- **Purchase Orders**: Create and track orders from suppliers
- **Order Status Management**: Monitor order delivery status
- **Bulk Purchasing**: Handle large quantity purchases efficiently
- **Supplier Analytics**: View supplier performance metrics

### Customer Management
- **Customer Profiles**: Store customer contact information and preferences
- **Purchase History**: View all transactions per customer
- **Loyalty Programs**: Track customer spending and rewards (extensible)
- **Contact Management**: Phone, email, and address tracking
- **Customer Segmentation**: Identify VIP and frequent customers

### Expense Tracking
- **Expense Logging**: Record daily operational expenses
- **Approval Workflows**: Multi-level approval for expense claims
- **Expense Categories**: Organize expenses by type
- **Budget Tracking**: Monitor spending against budget limits
- **Audit Trail**: Complete history of all expense modifications

### Analytics & Reporting
- **Sales Reports**: Daily, weekly, monthly sales analysis with charts
- **Inventory Reports**: Stock levels, fast-moving items, slow movers
- **Financial Reports**: Revenue, profit, and cost analysis
- **Staff Performance**: Sales metrics and efficiency tracking
- **Expense Reports**: Spending analysis and budget variance
- **Export Functionality**: PDF and Excel export for all reports
- **Interactive Dashboards**: Real-time data visualization with Recharts

### Notifications
- **Stock Alerts**: Low inventory notifications
- **Expiry Warnings**: Upcoming expiry date alerts
- **Order Updates**: Supplier delivery status notifications
- **System Notifications**: General application alerts
- **Notification Center**: Centralized notification management with history

### Staff Management
- **Staff Records**: Employee information and role assignments
- **Performance Tracking**: Sales and activity metrics per staff member
- **Role Assignment**: Dynamic role updates for team members
- **Attendance Tracking**: Work schedule and attendance logs

### Settings & Configuration
- **Business Settings**: Company information and preferences
- **System Configuration**: Tax rates, discount policies, payment methods
- **User Settings**: Notification preferences and display options
- **Backup & Restore**: Data backup and recovery options

---

## 🛠 Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3.1 | UI framework |
| **TypeScript** | 5.6.3 | Type safety |
| **Vite** | 6.0.1 | Build tool & dev server |
| **Tailwind CSS** | 3.4.15 | Utility-first CSS framework |
| **Zustand** | 5.0.2 | State management |
| **React Router DOM** | 7.0.2 | Client-side routing |
| **Axios** | 1.7.9 | HTTP client |
| **Recharts** | 2.15.0 | Data visualization |
| **html5-qrcode** | 2.3.8 | Barcode/QR code scanning |
| **jsPDF** | 3.0.4 | PDF generation |
| **ExcelJS** | 4.4.0 | Excel file generation |
| **Lucide React** | 0.469.0 | Icon library |
| **React Hot Toast** | 2.4.1 | Toast notifications |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 20.x+ | Runtime environment |
| **Express** | 4.21.2 | Web framework |
| **TypeScript** | 5.9.3 | Type safety |
| **Prisma** | 6.19.0 | ORM & database client |
| **MySQL** | 8.0+ | Database |
| **JWT** | 9.0.2 | Authentication |
| **bcrypt** | 5.1.1 | Password hashing |
| **express-validator** | 7.2.0 | Input validation |
| **CORS** | 2.8.5 | Cross-origin handling |
| **dotenv** | 16.4.7 | Environment variables |
| **Multer** | 1.4.5-lts.1 | File uploads |
| **tsx** | 4.19.2 | TypeScript runner |

---

## 📁 Project Structure

```
Taqwa/
├── client/                          # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/              # Reusable React components
│   │   │   ├── BarcodeScanner.tsx   # QR/Barcode scanner component
│   │   │   ├── Header.tsx           # Page header with notifications
│   │   │   ├── Layout.tsx           # Main layout wrapper
│   │   │   ├── Sidebar.tsx          # Navigation sidebar
│   │   │   ├── NotificationCenter.tsx # Notification management
│   │   │   └── ProductModal.tsx     # Product details modal
│   │   │
│   │   ├── pages/                   # Page components (route-based)
│   │   │   ├── Dashboard.tsx        # Analytics dashboard
│   │   │   ├── Products.tsx         # Product management
│   │   │   ├── Sales.tsx            # POS and billing
│   │   │   ├── Customers.tsx        # Customer management
│   │   │   ├── Suppliers.tsx        # Supplier management
│   │   │   ├── PurchaseOrders.tsx   # Purchase order management
│   │   │   ├── Expenses.tsx         # Expense tracking
│   │   │   ├── Staff.tsx            # Staff management
│   │   │   ├── Reports.tsx          # Report generation
│   │   │   ├── Settings.tsx         # Application settings
│   │   │   ├── Login.tsx            # Authentication page
│   │   │   └── Signup.tsx           # User registration
│   │   │
│   │   ├── services/
│   │   │   └── api.ts               # Axios API client with interceptors
│   │   │
│   │   ├── store/
│   │   │   └── authStore.ts         # Zustand auth state management
│   │   │
│   │   ├── App.tsx                  # Main app component
│   │   ├── App.css                  # Global styles
│   │   ├── index.css                # Reset & utility styles
│   │   └── main.tsx                 # React entry point
│   │
│   ├── index.html                   # HTML template
│   ├── vite.config.ts               # Vite configuration
│   ├── tailwind.config.js           # Tailwind CSS config
│   ├── postcss.config.js            # PostCSS config
│   ├── tsconfig.json                # TypeScript config
│   └── package.json                 # Frontend dependencies
│
├── server/                          # Backend (Express + Node.js)
│   ├── src/
│   │   ├── modules/                 # Feature modules (MVC pattern)
│   │   │   ├── auth/
│   │   │   │   ├── auth.controller.ts      # Authentication logic
│   │   │   │   ├── auth.service.ts         # Auth business logic
│   │   │   │   ├── auth.routes.ts          # Auth endpoints
│   │   │   │   ├── auth.types.ts           # Auth TypeScript types
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── products/
│   │   │   │   ├── products.controller.ts
│   │   │   │   ├── products.service.ts
│   │   │   │   └── products.routes.ts
│   │   │   │
│   │   │   ├── sales/
│   │   │   │   ├── sales.controller.ts     # Billing & transactions
│   │   │   │   ├── sales.service.ts
│   │   │   │   └── sales.routes.ts
│   │   │   │
│   │   │   ├── customers/
│   │   │   │   ├── customers.controller.ts
│   │   │   │   ├── customers.service.ts
│   │   │   │   └── customers.routes.ts
│   │   │   │
│   │   │   ├── suppliers/
│   │   │   │   ├── suppliers.controller.ts
│   │   │   │   ├── suppliers.service.ts
│   │   │   │   └── suppliers.routes.ts
│   │   │   │
│   │   │   ├── purchase-orders/
│   │   │   │   ├── purchase-orders.controller.ts
│   │   │   │   ├── purchase-orders.service.ts
│   │   │   │   └── purchase-orders.routes.ts
│   │   │   │
│   │   │   ├── expenses/
│   │   │   │   ├── expenses.controller.ts
│   │   │   │   ├── expenses.service.ts
│   │   │   │   └── expenses.routes.ts
│   │   │   │
│   │   │   ├── reports/
│   │   │   │   ├── reports.controller.ts  # Analytics & exports
│   │   │   │   ├── reports.service.ts
│   │   │   │   └── reports.routes.ts
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   ├── dashboard.controller.ts
│   │   │   │   ├── dashboard.service.ts
│   │   │   │   └── dashboard.routes.ts
│   │   │   │
│   │   │   ├── staff/
│   │   │   │   ├── staff.controller.ts
│   │   │   │   ├── staff.service.ts
│   │   │   │   └── staff.routes.ts
│   │   │   │
│   │   │   ├── notifications/
│   │   │   │   ├── notifications.controller.ts
│   │   │   │   ├── notifications.service.ts
│   │   │   │   └── notifications.routes.ts
│   │   │   │
│   │   │   └── settings/
│   │   │       ├── settings.controller.ts
│   │   │       ├── settings.service.ts
│   │   │       └── settings.routes.ts
│   │   │
│   │   ├── middleware/               # Express middleware
│   │   │   ├── auth.middleware.ts    # JWT verification
│   │   │   ├── error.middleware.ts   # Error handling
│   │   │   ├── logging.middleware.ts # Request logging
│   │   │   └── index.ts
│   │   │
│   │   ├── config/                   # Configuration
│   │   │   ├── app.config.ts         # App settings
│   │   │   ├── database.config.ts    # Prisma setup
│   │   │   └── index.ts
│   │   │
│   │   ├── constants/
│   │   │   └── index.ts              # HTTP status, messages, routes
│   │   │
│   │   ├── types/
│   │   │   └── index.ts              # TypeScript interfaces
│   │   │
│   │   ├── utils/
│   │   │   ├── formatters.util.ts    # Data formatting helpers
│   │   │   ├── jwt.util.ts           # JWT operations
│   │   │   ├── password.util.ts      # Password hashing
│   │   │   ├── validators.util.ts    # Input validation
│   │   │   └── index.ts
│   │   │
│   │   ├── errors/
│   │   │   └── index.ts              # Custom error classes
│   │   │
│   │   └── server.ts                 # Express app entry point
│   │
│   ├── prisma/
│   │   ├── schema.prisma             # Database schema definition
│   │   ├── seed.ts                   # Database seed script
│   │   ├── migrations/               # Database migrations
│   │   └── migration_lock.toml       # Migration lock file
│   │
│   ├── .env                          # Environment variables
│   ├── .env.example                  # Environment template
│   ├── tsconfig.json                 # TypeScript config
│   ├── package.json                  # Backend dependencies
│   └── dist/                         # Compiled JavaScript output

├── LICENSE                           # MIT License
└── README.md                         # This file
```

---

## 📋 Prerequisites

- **Node.js**: v20.x or higher
- **npm**: v10.x or higher (or yarn)
- **MySQL**: v8.0 or higher
- **Git**: For version control
- **Git Bash** (Windows) or Terminal (Mac/Linux)

**Verify Installation:**
```bash
node --version    # Should be v20.x+
npm --version     # Should be v10.x+
mysql --version   # Should be v8.0+
```

---

## 💾 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/kawsar-ahmmed-hridoy/Taqwa-Discount-Shop
cd Taqwa
```

### 2. Install Backend Dependencies
```bash
cd server
npm install
```

### 3. Install Frontend Dependencies
```bash
cd ../client
npm install
```

---

## ⚙️ Configuration

### Backend Setup (.env)

Create a `.env` file in the `server/` directory:

```env
# Database Configuration
DATABASE_URL="mysql://username:password@localhost:3306/taqwa_db"
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=taqwa_db
DB_PORT=3306

# Server Configuration
NODE_ENV=development
PORT=5000
HOST=localhost
API_PREFIX=/api
LOG_LEVEL=info

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# JWT Configuration
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=24h
```

### Frontend Setup (.env)

Create a `.env` file in the `client/` directory (optional, already configured):

```env
VITE_API_URL=http://localhost:5000/api
```

### Database Setup

```bash
# Navigate to server directory
cd server

# Generate Prisma client
npm run prisma:generate

# Push schema to database (creates tables)
npm run prisma:push

# Seed database with sample data (optional)
npm run seed
```

---

## 🚀 Running the Application

### Start Backend Server
```bash
cd server
npm run dev
```
Server runs on: `http://localhost:5000`

Health check endpoint: `http://localhost:5000/health`

### Start Frontend Development Server
```bash
cd client
npm run dev
```
Client runs on: `http://localhost:5173`

### Build for Production

**Backend:**
```bash
cd server
npm run build
npm start
```

**Frontend:**
```bash
cd client
npm run build
npm run preview
```

---

## 🔌 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Register new user |
| POST | `/auth/login` | User login |
| POST | `/auth/logout` | User logout |
| GET | `/auth/me` | Get current user |
| PUT | `/auth/profile` | Update user profile |
| POST | `/auth/reset-password` | Reset password |
| POST | `/auth/forgot-password` | Forgot password request |

**Request Header:**
```
Authorization: Bearer <token>
```

### Product Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | Get all products |
| GET | `/products/:id` | Get product by ID |
| POST | `/products` | Create product (Owner/Manager) |
| PUT | `/products/:id` | Update product (Owner/Manager) |
| DELETE | `/products/:id` | Delete product (Owner) |

### Sales Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/sales` | Get all sales |
| GET | `/sales/:id` | Get sale by ID |
| POST | `/sales` | Create new sale/bill |
| PUT | `/sales/:id` | Update sale status |

### Customer Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/customers` | Get all customers |
| GET | `/customers/:id` | Get customer details |
| POST | `/customers` | Add new customer |
| PUT | `/customers/:id` | Update customer |
| DELETE | `/customers/:id` | Delete customer |

### Supplier Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/suppliers` | Get all suppliers |
| POST | `/suppliers` | Add supplier |
| PUT | `/suppliers/:id` | Update supplier |
| DELETE | `/suppliers/:id` | Delete supplier |

### Purchase Order Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/purchase-orders` | Get all orders |
| POST | `/purchase-orders` | Create order |
| PUT | `/purchase-orders/:id` | Update order |
| DELETE | `/purchase-orders/:id` | Cancel order |

### Expense Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/expenses` | Get all expenses |
| POST | `/expenses` | Log new expense |
| PUT | `/expenses/:id` | Update expense |
| DELETE | `/expenses/:id` | Delete expense |

### Report Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reports/sales` | Sales report |
| GET | `/reports/inventory` | Inventory report |
| GET | `/reports/expenses` | Expense report |
| GET | `/reports/export` | Export report (PDF/Excel) |

### Dashboard Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/summary` | Dashboard metrics |
| GET | `/dashboard/charts` | Chart data |

---

## 🗄️ Database Schema

### Core Tables

**Users** - Authentication & role management
- id, email, fullName, password, role, isActive, createdAt, updatedAt

**Products** - Inventory items
- id, name, sku, barcode, price, cost, quantity, category, expiryDate, image

**Sales** - Transactions & billing
- id, totalAmount, vatAmount, discountAmount, paymentMode, status, customerId, staffId

**SaleItems** - Individual items in a sale
- id, quantity, unitPrice, discount, vat, saleId, productId

**Customers** - Customer information
- id, name, email, phone, address, totalSpent, lastPurchaseDate

**Suppliers** - Supplier information
- id, name, email, phone, address, paymentTerms

**PurchaseOrders** - Supplier orders
- id, orderNumber, totalAmount, status, supplierId, deliveryDate

**Expenses** - Expense tracking
- id, description, amount, category, status, date, approvedBy

**Staff** - Employee information
- id, name, email, phone, role, joinDate, isActive

**Notifications** - System notifications
- id, type, message, read, userId, createdAt

---

## 🔐 Role-Based Access Control (RBAC)

### Roles & Permissions

#### OWNER
- Full system access
- User management
- Financial reports
- System settings
- Approval authority

#### MANAGER
- Product & inventory management
- Sales access
- Customer management
- Supplier management
- Report generation
- Expense approval

#### STAFF
- POS access (sales)
- Customer lookup
- Product search
- View own reports

---

## 📚 Development Guidelines

### Code Structure
- Follow the modular MVC pattern
- Keep components focused and reusable
- Use TypeScript for type safety
- Separate business logic from UI

### API Response Format
```json
{
  "success": true,
  "message": "Operation successful",
  "statusCode": 200,
  "data": {}
}
```

### Error Handling
```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 400,
  "error": "VALIDATION_ERROR"
}
```

### Git Workflow
```bash
git checkout -b feature/feature-name
# Make changes
git commit -m "feat: add feature description"
git push origin feature/feature-name
# Create Pull Request
```

---

## 🐛 Troubleshooting

### Server Won't Start
1. **Check MySQL connection:**
   ```bash
   mysql -u root -p -h localhost
   ```
2. **Verify environment variables** in `.env`
3. **Check port 5000 is available:**
   ```bash
   netstat -ano | findstr :5000  # Windows
   lsof -i :5000                 # Mac/Linux
   ```

### Database Connection Error
1. Run Prisma setup:
   ```bash
   npm run prisma:push
   ```
2. Verify credentials in `DATABASE_URL`
3. Ensure MySQL service is running

### CORS Errors
- Check `CORS_ORIGIN` in `.env` matches frontend URL
- Ensure credentials are enabled in Axios

### Barcode Scanner Issues
- Check browser permissions for camera access
- Use HTTPS in production
- Test with valid barcode format

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👤 Author

**Kawsar Ahmmed Hridoy**

---

## 📞 Support

For issues and questions, please create an issue in the repository.

### 1. Clone the repository

```bash
git clone <repository-url>
cd pos-system
```

### 2. Setup Server

```bash
cd server
npm install
```

Create `.env` file in server directory:

```env
# Option A - MySQL (production-like)
DATABASE_URL="mysql://root:password@localhost:3306/takowa_discount_shop"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="24h"
PORT=5000
NODE_ENV=development

# Option B - SQLite (quick local dev - already configured in prisma/schema.prisma)
# If you prefer SQLite for local development, ensure `server/prisma/dev.db` exists (it is checked into this repo).
# You can keep the same `.env` but Prisma will use the datasource defined in `prisma/schema.prisma`.
```

Setup database:

```bash
npx prisma generate
npx prisma db push            # pushes Prisma schema to configured datasource (SQLite by default)
npm run seed                  # seeds initial users, products, suppliers, settings
```

Start server:

```bash
npm run dev
```

### 3. Setup Client

```bash
cd client
npm install
```

Create `.env` file in client directory:

```env
VITE_API_URL=http://localhost:5000/api
```

Start client:

```bash
npm run dev
```

## Default Login Credentials

After running the seed script:

**Owner:**
- Email: 
- Password: 

**Manager:**
- Email: 
- Password: 

**Staff:**
- Email: 
- Password: 

## Project Structure

```
pos-system/
├── README.md
│
├── client/                           # Frontend React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.tsx           # Main layout with sidebar
│   │   │   ├── ProductModal.tsx     # Product create/edit modal
│   │   │   └── BarcodeScanner.tsx   # Barcode scanning component
│   │   ├── pages/
│   │   │   ├── Login.tsx            # Login page
│   │   │   ├── signup.tsx           # signup page
│   │   │   ├── Dashboard.tsx        # Dashboard with stats
│   │   │   ├── Products.tsx         # Product management
│   │   │   ├── Sales.tsx            # POS billing interface
│   │   │   ├── Customers.tsx        # Customer management
│   │   │   ├── Suppliers.tsx        # Supplier management
│   │   │   ├── PurchaseOrders.tsx   # Purchase order tracking
│   │   │   ├── Expenses.tsx         # Expense tracking
│   │   │   ├── Staff.tsx            # Staff management
│   │   │   ├── Reports.tsx          # Reports & analytics
│   │   │   └── Settings.tsx         # System settings
│   │   ├── store/
│   │   │   └── authStore.ts         # Zustand auth state
│   │   ├── services/
│   │   │   └── api.ts               # API service layer
│   │   ├── App.tsx                  # Main app with routing
│   │   ├── main.tsx                 # Entry point
│   │   └── index.css                # Global styles
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── package.json
│   └── .env.example
│
└── server/                           # Backend Node.js application
    ├── src/
    │   ├── controllers/
    │   │   ├── auth.controller.ts
    │   │   ├── product.controller.ts
    │   │   ├── sale.controller.ts
    │   │   ├── customer.controller.ts
    │   │   ├── supplier.controller.ts
    │   │   ├── purchaseOrder.controller.ts
    │   │   ├── expense.controller.ts
    │   │   ├── staff.controller.ts
    │   │   ├── report.controller.ts
    │   │   ├── dashboard.controller.ts
    │   │   ├── notification.controller.ts
    │   │   └── settings.controller.ts
    │   ├── middleware/
    │   │   └── auth.middleware.ts     # JWT authentication
    │   ├── routes/
    │   │   ├── auth.routes.ts
    │   │   ├── product.routes.ts
    │   │   ├── sale.routes.ts
    │   │   ├── customer.routes.ts
    │   │   ├── supplier.routes.ts
    │   │   ├── purchaseOrder.routes.ts
    │   │   ├── expense.routes.ts
    │   │   ├── staff.routes.ts
    │   │   ├── report.routes.ts
    │   │   ├── dashboard.routes.ts
    │   │   ├── notification.routes.ts
    │   │   └── settings.routes.ts
    │   └── server.ts                  # Express server entry
    ├── prisma/
    │   ├── schema.prisma              # Prisma database schema
    │   └── seed.ts                    # Database seeding script
    ├── tsconfig.json
    ├── package.json
    └── .env
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/reset-password` - Password reset

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `POST /api/products/bulk-upload` - Bulk upload via CSV

### Sales
- `POST /api/sales` - Create sale
- `GET /api/sales` - Get all sales
- `GET /api/sales/:id` - Get sale by ID
- `GET /api/sales/invoice/:id` - Get invoice

### Customers
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `GET /api/customers/:id/history` - Purchase history

### Suppliers & Purchase Orders
- `GET /api/suppliers` - Get all suppliers
- `POST /api/suppliers` - Create supplier
- `GET /api/purchase-orders` - Get all orders
- `POST /api/purchase-orders` - Create order

### Expenses
- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Create expense
- `PUT /api/expenses/:id/approve` - Approve expense

### Staff
- `GET /api/staff` - Get all staff
- `POST /api/staff` - Create staff member
- `PUT /api/staff/:id` - Update staff

### Reports
- `GET /api/reports/sales` - Sales report
- `GET /api/reports/inventory` - Inventory report
- `GET /api/reports/expenses` - Expense report

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- SQL injection prevention via Prisma ORM
- CORS configuration
- Input validation
- Secure HTTP headers

## Database Schema

The system uses MySQL with Prisma ORM. Key tables:

- Users (staff, manager, owner)
- Products
- Categories
- Suppliers
- Customers
- Sales & SaleItems
- PurchaseOrders & PurchaseOrderItems
- Expenses
- AuditLogs
- Notifications

## Development

### Running Tests

```bash
# Server tests
cd server
npm test

# Client tests
cd client
npm test
```

### Building for Production

```bash
# Build client
cd client
npm run build

# Build server
cd server
npm run build
```

## Deployment

1. Set up MySQL database on production server
2. Update environment variables
3. Build both client and server
4. Deploy server to Node.js hosting (e.g., Railway, Render)
5. Deploy client to static hosting (e.g., Vercel, Netlify)
6. Configure HTTPS
7. Set up automated backups

## Troubleshooting

### Database Connection Issues
- Verify MySQL is running
- Check DATABASE_URL in .env
- Ensure database exists

### Port Conflicts
- Change PORT in server .env
- Update VITE_API_URL in client .env

### Build Errors
- Clear node_modules and reinstall
- Check Node.js version compatibility
- Verify all environment variables are set

## License

MIT

## Support

For issues and questions, please create an issue in the repository.