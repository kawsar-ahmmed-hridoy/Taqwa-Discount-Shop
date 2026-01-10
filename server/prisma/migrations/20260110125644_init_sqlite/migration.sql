-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "categories" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "products" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "barcode" TEXT,
    "sku" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "brand" TEXT,
    "purchasePrice" REAL NOT NULL,
    "sellingPrice" REAL NOT NULL,
    "discount" REAL NOT NULL DEFAULT 0,
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "minStockLevel" INTEGER NOT NULL DEFAULT 10,
    "expiryDate" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "customers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "sales" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoiceNo" TEXT NOT NULL,
    "customerId" INTEGER,
    "userId" INTEGER NOT NULL,
    "subtotal" REAL NOT NULL,
    "discount" REAL NOT NULL DEFAULT 0,
    "vat" REAL NOT NULL,
    "total" REAL NOT NULL,
    "paymentMode" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sales_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "sales_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sale_items" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "saleId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" REAL NOT NULL,
    "discount" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL,
    CONSTRAINT "sale_items_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sale_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderNo" TEXT NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "orderDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveryDate" DATETIME,
    "total" REAL NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "purchase_orders_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "purchase_orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "purchase_order_items" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "purchaseOrderId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" REAL NOT NULL,
    "total" REAL NOT NULL,
    CONSTRAINT "purchase_order_items_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "purchase_order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "category" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "userId" INTEGER NOT NULL,
    "expenseDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "expenses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "stock_adjustments" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stock_adjustments_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" INTEGER,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "relatedEntityType" TEXT,
    "relatedEntityId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "products_barcode_key" ON "products"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE INDEX "products_categoryId_idx" ON "products"("categoryId");

-- CreateIndex
CREATE INDEX "products_barcode_idx" ON "products"("barcode");

-- CreateIndex
CREATE INDEX "products_sku_idx" ON "products"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "customers_phone_key" ON "customers"("phone");

-- CreateIndex
CREATE INDEX "customers_phone_idx" ON "customers"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "sales_invoiceNo_key" ON "sales"("invoiceNo");

-- CreateIndex
CREATE INDEX "sales_invoiceNo_idx" ON "sales"("invoiceNo");

-- CreateIndex
CREATE INDEX "sales_customerId_idx" ON "sales"("customerId");

-- CreateIndex
CREATE INDEX "sales_userId_idx" ON "sales"("userId");

-- CreateIndex
CREATE INDEX "sales_createdAt_idx" ON "sales"("createdAt");

-- CreateIndex
CREATE INDEX "sale_items_saleId_idx" ON "sale_items"("saleId");

-- CreateIndex
CREATE INDEX "sale_items_productId_idx" ON "sale_items"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_phone_key" ON "suppliers"("phone");

-- CreateIndex
CREATE INDEX "suppliers_phone_idx" ON "suppliers"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_orderNo_key" ON "purchase_orders"("orderNo");

-- CreateIndex
CREATE INDEX "purchase_orders_orderNo_idx" ON "purchase_orders"("orderNo");

-- CreateIndex
CREATE INDEX "purchase_orders_supplierId_idx" ON "purchase_orders"("supplierId");

-- CreateIndex
CREATE INDEX "purchase_orders_userId_idx" ON "purchase_orders"("userId");

-- CreateIndex
CREATE INDEX "purchase_order_items_purchaseOrderId_idx" ON "purchase_order_items"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "purchase_order_items_productId_idx" ON "purchase_order_items"("productId");

-- CreateIndex
CREATE INDEX "expenses_userId_idx" ON "expenses"("userId");

-- CreateIndex
CREATE INDEX "expenses_status_idx" ON "expenses"("status");

-- CreateIndex
CREATE INDEX "expenses_expenseDate_idx" ON "expenses"("expenseDate");

-- CreateIndex
CREATE INDEX "stock_adjustments_productId_idx" ON "stock_adjustments"("productId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");
