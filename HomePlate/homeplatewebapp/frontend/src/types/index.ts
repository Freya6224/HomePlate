export interface User {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'seller';
  created_at: string;
}

export interface FoodItem {
  id: string;
  seller_id: string;
  seller_name: string;
  name: string;
  description: string;
  price: number;
  category: string;
  is_available: boolean;
  image_url: string | null;
  avg_rating: number;
  review_count: number;
  created_at: string;
  is_favorite?: boolean;
}

export interface OrderItem {
  food_item_id: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  customer_id: string;
  customer_name: string;
  seller_id: string;
  seller_name: string;
  items: OrderItem[];
  total_amount: number;
  status: OrderStatus;
  delivery_address: string;
  notes: string | null;
  created_at: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

export interface Review {
  id: string;
  food_item_id: string;
  customer_id: string;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface CartItem extends FoodItem {
  quantity: number;
}

export interface AuthContextType {
  user: User | null | false;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (email: string, password: string, name: string, role: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export interface AuthResult {
  success: boolean;
  data?: User;
  error?: string;
}
