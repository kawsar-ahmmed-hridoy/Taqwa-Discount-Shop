# Takowa Discount Shop

A comprehensive Point of Sale system with role-based access control, inventory management, billing, and analytics.

## Features

- **Role-based Authentication**: Owner, Manager, and Staff roles with specific permissions
- **Real-time Billing**: Barcode scanning, dynamic cart, VAT calculations
- **Inventory Management**: Stock tracking, low stock alerts, expiry monitoring
- **Purchase Orders**: Supplier management and order tracking
- **Customer Management**: Loyalty programs, purchase history
- **Expense Tracking**: Daily expense logging with approval workflows
- **Analytics & Reports**: Comprehensive reports with PDF/Excel export
- **Real-time Notifications**: Stock alerts, expiry warnings, delivery updates

## Tech Stack

### Frontend
- React 18.3.1
- TypeScript 5.6.3
- Tailwind CSS 3.4.15
- Vite 6.0.1
- Zustand 5.0.2 (State Management)
- React Router DOM 7.0.2
- Axios 1.7.9
- Recharts 2.15.0
- html5-qrcode 2.3.8
- jsPDF 2.5.2
- ExcelJS 4.4.0
- React Hot Toast 2.4.1

### Backend
- Node.js 20+
- Express 4.21.2
- TypeScript 5.6.3
- Prisma 6.1.0 (ORM)
- MySQL 8.0+
- JWT (jsonwebtoken 9.0.2)
- bcrypt 5.1.1
- express-validator 7.2.0
- cors 2.8.5

## Prerequisites

- Node.js 20.x or higher
- MySQL 8.0 or higher
- npm or yarn

## Installation

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
DATABASE_URL="mysql://root:password@localhost:.../takowa_discount_shop"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="24h"
PORT=5000
NODE_ENV=development
```

Setup database:

```bash
npx prisma generate
npx prisma db push
npm run seed
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