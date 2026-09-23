export type Category = {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
  children: Category[];
};

export type ProductListItem = {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  status: string;
  isFeatured: boolean;
  image: string | null;
  price: number | null;
  variantCount: number;
  totalStock: number;
  category: { id: string; name: string } | null;
  createdAt: string;
};

export type ProductImage = { id: string; url: string; alt: string | null; sortOrder: number };

export type ProductVariant = {
  id: string;
  productId: string;
  name: string | null;
  sku: string;
  price: string;
  comparePrice: string | null;
  taxRate: string | null;
  weightGrams: number | null;
  attributes: Record<string, string>;
  isDefault: boolean;
  inventory: { id: string; qtyOnHand: number; qtyReserved: number; qtyAvailable: number; lowStockThreshold: number } | null;
};

export type ProductDetail = {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  description: string | null;
  shortDesc: string | null;
  status: string;
  isFeatured: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  categoryId: string | null;
  category: { id: string; name: string } | null;
  images: ProductImage[];
  variants: ProductVariant[];
};

export type InventoryRow = {
  inventoryId: string;
  variantId: string;
  qtyOnHand: number;
  qtyReserved: number;
  qtyAvailable: number;
  lowStockThreshold: number;
  updatedAt: string;
  sku: string;
  variantName: string | null;
  productId: string;
  productName: string;
  warehouseId: string | null;
  warehouseName: string | null;
};

export type StockMovement = {
  id: string;
  variantId: string;
  type: string;
  quantity: number;
  qtyBefore: number;
  qtyAfter: number;
  reason: string | null;
  adminUserId: string | null;
  createdAt: string;
};

export type OrderListItem = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  total: string;
  currency: string;
  createdAt: string;
  customerName: string;
  customerEmail: string | null;
};

export type OrderDetail = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  subtotal: string;
  discountAmount: string;
  taxAmount: string;
  shippingAmount: string;
  total: string;
  currency: string;
  shippingAddressSnapshot: Record<string, any>;
  shippingMethod: string | null;
  notes: string | null;
  cancelReason: string | null;
  createdAt: string;
  items: { id: string; variantId: string; productSnapshot: any; quantity: number; unitPrice: string; totalPrice: string }[];
  history: { id: string; status: string; note: string | null; createdAt: string }[];
  payments: { id: string; provider: string; method: string | null; amount: string; status: string; capturedAt: string | null }[];
  refunds: { id: string; amount: string; reason: string | null; status: string; createdAt: string }[];
  customer: { id: string; email: string; firstName?: string; lastName?: string } | null;
};

export type CustomerListItem = {
  id: string;
  email: string;
  phone: string | null;
  status: string;
  createdAt: string;
  firstName: string | null;
  lastName: string | null;
  orderCount: number;
  totalSpend: string;
};

export type CustomerDetail = {
  id: string;
  email: string;
  phone: string | null;
  status: string;
  emailVerified: boolean;
  createdAt: string;
  firstName?: string;
  lastName?: string;
  addresses: any[];
  orders: { id: string; orderNumber: string; status: string; total: string; createdAt: string }[];
  notes: { id: string; note: string; createdAt: string; adminUserId: string | null }[];
};

export type DashboardSummary = {
  gmv: number;
  orderCount: number;
  aov: number;
  lowStockCount: number;
  outOfStockCount: number;
  needsAttention: { awaitingFulfilment: number; paymentFailed: number; lowStockSkus: number };
  revenueByDay: { date: string; total: number }[];
};

export type Warehouse = { id: string; name: string; code: string };

export type TicketListItem = {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  status: string;
  createdAt: string;
};

export type TicketReply = { id: string; ticketId: string; adminUserId: string | null; note: string; createdAt: string };

export type TicketDetail = TicketListItem & { replies: TicketReply[] };

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type PlatformSettings = {
  default_tax_rate: string;
  low_stock_threshold: string;
  free_shipping_threshold: string;
  currency: string;
  support_email: string;
  support_hours: string;
};

export type DeliveryPaymentSettings = {
  free_shipping_threshold: string;
  delivery_days_estimate: string;
  payment_cod_enabled: string;
  payment_card_enabled: string;
  payment_upi_enabled: string;
  payment_wallet_enabled: string;
};

export type ThemeTokens = {
  accent: string;
  accentDark: string;
  accentSoft: string;
  ink: string;
  slate: string;
  paper: string;
  chrome: string;
  border: string;
  muted: string;
  faint: string;
};

export type ThemeDef = { id: string; name: string; description: string; tokens: ThemeTokens };

export type ThemesResponse = { themes: ThemeDef[]; activeThemeId: string };

export type Analytics = {
  totals: { totalRevenue: number; totalOrders: number; avgOrderValue: number; totalCustomers: number };
  revenueByDay: { date: string; total: number }[];
  ordersByStatus: { status: string; count: number }[];
  topProducts: { name: string; unitsSold: number; revenue: number }[];
  salesByCategory: { category: string; revenue: number; unitsSold: number }[];
  customerGrowth: { week: string; count: number }[];
};
