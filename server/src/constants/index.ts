export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const MESSAGES = {
  // Success messages
  SUCCESS: 'Operation successful',
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',

  // Error messages
  INVALID_INPUT: 'Invalid input provided',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  DUPLICATE: 'Resource already exists',
  INTERNAL_ERROR: 'Internal server error',
  DATABASE_ERROR: 'Database operation failed',
  VALIDATION_ERROR: 'Validation failed',

  // Auth messages
  INVALID_CREDENTIALS: 'Invalid email or password',
  TOKEN_EXPIRED: 'Token has expired',
  INVALID_TOKEN: 'Invalid or malformed token',
  USER_ALREADY_EXISTS: 'User already exists',
  USER_NOT_FOUND: 'User not found',

  // Product messages
  PRODUCT_NOT_FOUND: 'Product not found',
  INSUFFICIENT_STOCK: 'Insufficient stock',

  // Customer messages
  CUSTOMER_NOT_FOUND: 'Customer not found',

  // Supplier messages
  SUPPLIER_NOT_FOUND: 'Supplier not found',
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  STAFF: 'staff',
} as const;

export const API_ROUTES = {
  AUTH: '/api/auth',
  PRODUCTS: '/api/products',
  SALES: '/api/sales',
  CUSTOMERS: '/api/customers',
  SUPPLIERS: '/api/suppliers',
  PURCHASE_ORDERS: '/api/purchase-orders',
  EXPENSES: '/api/expenses',
  STAFF: '/api/staff',
  AUDIT_LOGS: '/api/audit-logs',
  REPORTS: '/api/reports',
  DASHBOARD: '/api/dashboard',
  NOTIFICATIONS: '/api/notifications',
  SETTINGS: '/api/settings',
} as const;
