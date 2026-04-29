import 'dotenv/config';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { connectDatabase, disconnectDatabase, checkDatabaseHealth } from './config';
import { config } from './config/app.config';
import { requestLogger, requestId, sanitizeBody, errorHandler, notFoundHandler } from './middleware';
import { HTTP_STATUS } from './constants';
import { API_ROUTES } from './constants';

import authRoutes from './modules/auth/auth.routes';
import productsRoutes from './modules/products/products.routes';
import salesRoutes from './modules/sales/sales.routes';
import customersRoutes from './modules/customers/customers.routes';
import suppliersRoutes from './modules/suppliers/suppliers.routes';
import purchaseOrdersRoutes from './modules/purchase-orders/purchase-orders.routes';
import expensesRoutes from './modules/expenses/expenses.routes';
import staffRoutes from './modules/staff/staff.routes';
import reportsRoutes from './modules/reports/reports.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import settingsRoutes from './modules/settings/settings.routes';

const app: Application = express();

//Setting up middlewares
app.use(requestId);
app.use(requestLogger);
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeBody);

app.get('/health', async (_req: Request, res: Response) => {
  try {
    const dbHealthy = await checkDatabaseHealth();
    res.status(HTTP_STATUS.OK).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: config.NODE_ENV,
      database: dbHealthy ? 'connected' : 'disconnected',
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      message: 'Health check failed',
    });
  }
});


app.use(API_ROUTES.AUTH, authRoutes);
app.use(API_ROUTES.PRODUCTS, productsRoutes);
app.use(API_ROUTES.SALES, salesRoutes);
app.use(API_ROUTES.CUSTOMERS, customersRoutes);
app.use(API_ROUTES.SUPPLIERS, suppliersRoutes);
app.use(API_ROUTES.PURCHASE_ORDERS, purchaseOrdersRoutes);
app.use(API_ROUTES.EXPENSES, expensesRoutes);
app.use(API_ROUTES.STAFF, staffRoutes);
app.use(API_ROUTES.REPORTS, reportsRoutes);
app.use(API_ROUTES.DASHBOARD, dashboardRoutes);
app.use(API_ROUTES.NOTIFICATIONS, notificationsRoutes);
app.use(API_ROUTES.SETTINGS, settingsRoutes);


//egulo last e rakhte hobe
app.use(notFoundHandler);
app.use(errorHandler);


const startServer = async () => {
  try {
    await connectDatabase();

    app.listen(config.PORT, config.HOST, () => {
      console.log(`Server started at http://${config.HOST}:${config.PORT} in ${config.NODE_ENV} mode`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};


const shutdown = async () => {
  console.log('\nShutting down server...');
  await disconnectDatabase();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

startServer();

export default app;
