export type Category = 'home' | 'accessories' | 'essentials';
export type Product = {
  id: string;
  slug: string;
  name: string;
  category: Category;
  price_minor: number;
  description: string;
  details: string[];
  image_url: string;
  image_alt: string;
  available: boolean;
  featured: boolean;
  badge: string | null;
};
export type CartItem = { productId: string; quantity: number };
export type Delivery = {
  name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  instructions: string;
};
export type OrderStatus = 'pending' | 'paid' | 'failed' | 'expired';
export type OrderItem = {
  product_id: string;
  name: string;
  description: string;
  image_url: string;
  unit_price_minor: number;
  quantity: number;
};
export type Order = {
  id: string;
  user_id: string;
  status: OrderStatus;
  total_minor: number;
  currency: 'ETB';
  delivery: Delivery;
  created_at: string;
  order_items: OrderItem[];
};
export type PaymentAttempt = {
  id: string;
  order_id: string;
  status: 'initializing' | 'ready' | 'unresolved' | 'failed';
  provider_order_id: string | null;
  payment_url: string | null;
  expires_at: string | null;
};
export type SessionUser = { id: string; email?: string };
export type ApiErrorBody = {
  error: { code: string; message: string; fields?: Record<string, string>; orderId?: string };
};
