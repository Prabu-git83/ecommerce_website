export type Money = number;

export type ActiveTheme = {
  id: string;
  name: string;
  tokens: Record<
    "accent" | "accentDark" | "accentSoft" | "ink" | "slate" | "paper" | "chrome" | "border" | "muted" | "faint",
    string
  >;
};

export type ActiveBanner = {
  banner_eyebrow: string;
  banner_heading: string;
  banner_subtext: string;
  banner_cta_label: string;
  banner_cta_link: string;
  banner_image_url: string;
};

export type Category = {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  children: Category[];
};

export type ProductSummary = {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  shortDesc: string | null;
  image: string | null;
  price: Money | null;
  comparePrice: Money | null;
  isFeatured: boolean;
  inStock: boolean;
};

export type ProductVariant = {
  id: string;
  productId: string;
  name: string | null;
  sku: string;
  price: string;
  comparePrice: string | null;
  attributes: Record<string, string>;
  isDefault: boolean;
  qtyAvailable: number;
  lowStock: boolean;
};

export type ProductDetail = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDesc: string | null;
  images: string[];
  variants: ProductVariant[];
  category: Category | null;
  related: ProductSummary[];
};

export type CartItem = {
  id: string;
  quantity: number;
  variantId: string;
  variantName: string | null;
  sku: string;
  price: string;
  comparePrice: string | null;
  attributes: Record<string, string>;
  productId: string;
  productName: string;
  productSlug: string;
  qtyAvailable: number | null;
  image: string | null;
};

export type CartDetail = {
  id: string;
  items: CartItem[];
  coupon: { code: string; type: string; value: string } | null;
  summary: {
    subtotal: number;
    discount: number;
    tax: number;
    shipping: number;
    total: number;
    currency: string;
  };
};

export type Address = {
  id: string;
  type: "shipping" | "billing";
  fullName: string;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postcode: string;
  countryCode: string;
  isDefault: boolean;
};

export type TicketSummary = {
  id: string;
  subject: string | null;
  message: string;
  status: string;
  createdAt: string;
};

export type TicketReply = { id: string; note: string; createdAt: string };

export type TicketDetail = TicketSummary & { name: string; email: string; replies: TicketReply[] };

export type User = {
  id: string;
  email: string;
  phone: string | null;
  emailVerified: boolean;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
};

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "return_requested"
  | "returned";

export type OrderSummary = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: string;
  total: string;
  currency: string;
  createdAt: string;
};

export type OrderItem = {
  id: string;
  variantId: string;
  productSnapshot: { name: string; sku: string; variantName?: string | null };
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  image: string | null;
};

export type OrderDetail = OrderSummary & {
  subtotal: string;
  discountAmount: string;
  taxAmount: string;
  shippingAmount: string;
  shippingAddressSnapshot: Address | Record<string, never>;
  shippingMethod: string | null;
  paymentMethod: string | null;
  items: OrderItem[];
  history: { id: string; status: string; note: string | null; createdAt: string }[];
};

export type ApiEnvelope<T> = {
  data: T;
  meta: Record<string, unknown> | null;
  error: { code: string; message: string; fields: Record<string, string> | null } | null;
};
