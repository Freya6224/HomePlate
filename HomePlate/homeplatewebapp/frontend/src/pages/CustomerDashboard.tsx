import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { FoodItem, Order, CartItem, Review } from '../types';
import { 
  ChefHat, Search, Heart, ShoppingBag, Clock, Star, LogOut, 
  Filter, Plus, Minus, MapPin, Loader2, HeartOff
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Toaster, toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CustomerDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<string>('browse');
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [favorites, setFavorites] = useState<FoodItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showOrderDialog, setShowOrderDialog] = useState<boolean>(false);
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [orderLoading, setOrderLoading] = useState<boolean>(false);
  
  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null);
  const [showItemDialog, setShowItemDialog] = useState<boolean>(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState<{ rating: number; comment: string }>({ rating: 5, comment: '' });
  const [reviewLoading, setReviewLoading] = useState<boolean>(false);

  const fetchData = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const [itemsRes, favsRes, ordersRes, catsRes] = await Promise.all([
        axios.get<FoodItem[]>(`${API_URL}/api/food-items`, { withCredentials: true }),
        axios.get<FoodItem[]>(`${API_URL}/api/favorites`, { withCredentials: true }),
        axios.get<Order[]>(`${API_URL}/api/orders`, { withCredentials: true }),
        axios.get<string[]>(`${API_URL}/api/categories`, { withCredentials: true })
      ]);
      
      const favIds = new Set(favsRes.data.map(f => f.id));
      const itemsWithFav = itemsRes.data.map(item => ({
        ...item,
        is_favorite: favIds.has(item.id)
      }));
      
      setFoodItems(itemsWithFav);
      setFavorites(favsRes.data);
      setOrders(ordersRes.data);
      setCategories(catsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = async (): Promise<void> => {
    await logout();
    navigate('/');
  };

  const toggleFavorite = async (item: FoodItem): Promise<void> => {
    try {
      if (item.is_favorite) {
        await axios.delete(`${API_URL}/api/favorites/${item.id}`, { withCredentials: true });
        toast.success('Removed from favorites');
      } else {
        await axios.post(`${API_URL}/api/favorites/${item.id}`, {}, { withCredentials: true });
        toast.success('Added to favorites');
      }
      
      setFoodItems(prev => prev.map(i => 
        i.id === item.id ? { ...i, is_favorite: !i.is_favorite } : i
      ));
      setFavorites(prev => 
        item.is_favorite 
          ? prev.filter(f => f.id !== item.id)
          : [...prev, { ...item, is_favorite: true }]
      );
    } catch (error) {
      toast.error('Failed to update favorites');
    }
  };

  const addToCart = (item: FoodItem): void => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    toast.success(`${item.name} added to cart`);
  };

  const updateCartQuantity = (itemId: string, delta: number): void => {
    setCart(prev => {
      const updated = prev.map(item => {
        if (item.id === itemId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter((item): item is CartItem => item !== null);
      return updated;
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const currentSeller = cart.length > 0 ? cart[0].seller_id : null;

  const placeOrder = async (): Promise<void> => {
    if (!deliveryAddress.trim()) {
      toast.error('Please enter delivery address');
      return;
    }
    
    setOrderLoading(true);
    try {
      const orderData = {
        items: cart.map(item => ({
          food_item_id: item.id,
          quantity: item.quantity
        })),
        delivery_address: deliveryAddress,
        notes: orderNotes || null
      };
      
      await axios.post(`${API_URL}/api/orders`, orderData, { withCredentials: true });
      toast.success('Order placed successfully!');
      setCart([]);
      setShowOrderDialog(false);
      setDeliveryAddress('');
      setOrderNotes('');
      fetchData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      const msg = err.response?.data?.detail || 'Failed to place order';
      toast.error(typeof msg === 'string' ? msg : 'Failed to place order');
    } finally {
      setOrderLoading(false);
    }
  };

  const viewItemDetails = async (item: FoodItem): Promise<void> => {
    setSelectedItem(item);
    setShowItemDialog(true);
    try {
      const res = await axios.get<Review[]>(`${API_URL}/api/reviews/${item.id}`, { withCredentials: true });
      setReviews(res.data);
    } catch {
      setReviews([]);
    }
  };

  const submitReview = async (): Promise<void> => {
    if (!newReview.comment.trim() || !selectedItem) {
      toast.error('Please write a comment');
      return;
    }
    
    setReviewLoading(true);
    try {
      await axios.post(`${API_URL}/api/reviews`, {
        food_item_id: selectedItem.id,
        rating: newReview.rating,
        comment: newReview.comment
      }, { withCredentials: true });
      
      toast.success('Review submitted!');
      setNewReview({ rating: 5, comment: '' });
      
      const res = await axios.get<Review[]>(`${API_URL}/api/reviews/${selectedItem.id}`, { withCredentials: true });
      setReviews(res.data);
      fetchData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      const msg = err.response?.data?.detail || 'Failed to submit review';
      toast.error(typeof msg === 'string' ? msg : 'Failed to submit review');
    } finally {
      setReviewLoading(false);
    }
  };

  const filteredItems = foodItems.filter(item => {
    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSeller = !currentSeller || cart.length === 0 || item.seller_id === currentSeller;
    return matchesSearch && matchesCategory && matchesSeller;
  });

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-purple-100 text-purple-800',
      ready: 'bg-green-100 text-green-800',
      delivered: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D05A45]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7]" data-testid="customer-dashboard">
      <Toaster position="top-right" richColors />
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#FDFBF7]/90 backdrop-blur-md border-b border-[#EAE0D5]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#D05A45] rounded-full flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <span className="font-heading text-xl font-semibold text-[#3B2E2A]">Home Plate</span>
              <p className="text-xs text-[#75635C]">Welcome, {user ? user.name : ''}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowOrderDialog(true)}
              className="relative p-2 text-[#75635C] hover:text-[#D05A45] transition-colors"
              data-testid="cart-btn"
            >
              <ShoppingBag className="w-6 h-6" strokeWidth={1.5} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#D05A45] text-white text-xs rounded-full flex items-center justify-center">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-[#75635C] hover:text-[#D05A45] transition-colors"
              data-testid="logout-btn"
            >
              <LogOut className="w-5 h-5" strokeWidth={1.5} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#F5EFE6] p-1 rounded-xl mb-8">
            <TabsTrigger 
              value="browse" 
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6"
              data-testid="browse-tab"
            >
              Browse
            </TabsTrigger>
            <TabsTrigger 
              value="favorites"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6"
              data-testid="favorites-tab"
            >
              Favorites ({favorites.length})
            </TabsTrigger>
            <TabsTrigger 
              value="orders"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6"
              data-testid="orders-tab"
            >
              Orders ({orders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="mt-0">
            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#75635C]" strokeWidth={1.5} />
                <input
                  type="text"
                  placeholder="Search for dishes..."
                  value={searchQuery}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className="w-full hp-input pl-12 pr-4 py-3"
                  data-testid="search-input"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-48 hp-input" data-testid="category-filter">
                  <Filter className="w-4 h-4 mr-2" strokeWidth={1.5} />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {cart.length > 0 && (
              <div className="mb-6 p-4 bg-[#F5EFE6] rounded-xl flex items-center justify-between">
                <p className="text-sm text-[#75635C]">
                  <span className="font-medium text-[#3B2E2A]">{cart.length} items</span> in cart from {cart[0].seller_name}
                </p>
                <button
                  onClick={() => setCart([])}
                  className="text-sm text-[#D05A45] hover:underline"
                  data-testid="clear-cart-btn"
                >
                  Clear Cart
                </button>
              </div>
            )}

            {/* Food Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map(item => (
                <div key={item.id} className="hp-card hp-card-hover group" data-testid={`food-item-${item.id}`}>
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img 
                      src={item.image_url || 'https://images.pexels.com/photos/7111387/pexels-photo-7111387.jpeg'} 
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <button
                      onClick={() => toggleFavorite(item)}
                      className="absolute top-3 right-3 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition-colors"
                      data-testid={`favorite-btn-${item.id}`}
                    >
                      <Heart 
                        className={`w-5 h-5 ${item.is_favorite ? 'fill-[#D05A45] text-[#D05A45]' : 'text-[#75635C]'}`} 
                        strokeWidth={1.5} 
                      />
                    </button>
                    <div className="absolute bottom-3 left-3">
                      <span className="hp-badge">{item.category}</span>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <h3 
                        className="font-heading text-lg font-medium text-[#3B2E2A] cursor-pointer hover:text-[#D05A45]"
                        onClick={() => viewItemDetails(item)}
                      >
                        {item.name}
                      </h3>
                      <span className="text-lg font-semibold text-[#D05A45]">${item.price.toFixed(2)}</span>
                    </div>
                    <p className="text-sm text-[#75635C] mb-3 line-clamp-2">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-[#E89B27] text-[#E89B27]" strokeWidth={1.5} />
                        <span className="text-sm font-medium text-[#3B2E2A]">{item.avg_rating.toFixed(1)}</span>
                        <span className="text-sm text-[#75635C]">({item.review_count})</span>
                      </div>
                      <button
                        onClick={() => addToCart(item)}
                        disabled={currentSeller !== null && currentSeller !== item.seller_id}
                        className="hp-btn-primary text-sm px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        data-testid={`add-to-cart-${item.id}`}
                      >
                        Add to Cart
                      </button>
                    </div>
                    <p className="text-xs text-[#75635C] mt-3">by {item.seller_name}</p>
                  </div>
                </div>
              ))}
            </div>

            {filteredItems.length === 0 && (
              <div className="text-center py-16">
                <Search className="w-12 h-12 text-[#EAE0D5] mx-auto mb-4" strokeWidth={1.5} />
                <p className="text-[#75635C]">No food items found</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="favorites" className="mt-0">
            {favorites.length === 0 ? (
              <div className="text-center py-16">
                <HeartOff className="w-12 h-12 text-[#EAE0D5] mx-auto mb-4" strokeWidth={1.5} />
                <p className="text-[#75635C]">No favorites yet</p>
                <p className="text-sm text-[#75635C] mt-1">Browse and add items to your favorites</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map(item => (
                  <div key={item.id} className="hp-card hp-card-hover group" data-testid={`favorite-item-${item.id}`}>
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img 
                        src={item.image_url || 'https://images.pexels.com/photos/7111387/pexels-photo-7111387.jpeg'} 
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <button
                        onClick={() => toggleFavorite(item)}
                        className="absolute top-3 right-3 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition-colors"
                      >
                        <Heart className="w-5 h-5 fill-[#D05A45] text-[#D05A45]" strokeWidth={1.5} />
                      </button>
                    </div>
                    <div className="p-5">
                      <h3 className="font-heading text-lg font-medium text-[#3B2E2A]">{item.name}</h3>
                      <p className="text-lg font-semibold text-[#D05A45] mt-1">${item.price.toFixed(2)}</p>
                      <button
                        onClick={() => addToCart(item)}
                        className="mt-3 w-full hp-btn-primary text-sm py-2"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders" className="mt-0">
            {orders.length === 0 ? (
              <div className="text-center py-16">
                <Clock className="w-12 h-12 text-[#EAE0D5] mx-auto mb-4" strokeWidth={1.5} />
                <p className="text-[#75635C]">No orders yet</p>
                <p className="text-sm text-[#75635C] mt-1">Start browsing and place your first order</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.id} className="hp-card p-6" data-testid={`order-${order.id}`}>
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div>
                        <p className="text-sm text-[#75635C]">Order #{order.id.slice(-8)}</p>
                        <p className="font-heading text-lg font-medium text-[#3B2E2A]">
                          From {order.seller_name}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="border-t border-[#EAE0D5] pt-4">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm py-1">
                          <span className="text-[#3B2E2A]">{item.quantity}x {item.name}</span>
                          <span className="text-[#75635C]">${item.subtotal.toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between font-medium mt-2 pt-2 border-t border-[#EAE0D5]">
                        <span className="text-[#3B2E2A]">Total</span>
                        <span className="text-[#D05A45]">${order.total_amount.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-sm text-[#75635C]">
                      <MapPin className="w-4 h-4" strokeWidth={1.5} />
                      {order.delivery_address}
                    </div>
                    <p className="text-xs text-[#75635C] mt-2">
                      Ordered on {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Order Dialog */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">Your Cart</DialogTitle>
            <DialogDescription>Review your order and checkout</DialogDescription>
          </DialogHeader>
          
          {cart.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag className="w-12 h-12 text-[#EAE0D5] mx-auto mb-4" strokeWidth={1.5} />
              <p className="text-[#75635C]">Your cart is empty</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-4 p-3 bg-[#F5EFE6] rounded-xl">
                    <img 
                      src={item.image_url || 'https://images.pexels.com/photos/7111387/pexels-photo-7111387.jpeg'} 
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-[#3B2E2A]">{item.name}</p>
                      <p className="text-sm text-[#D05A45]">${item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateCartQuantity(item.id, -1)}
                        className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-[#EAE0D5]"
                        data-testid={`decrease-qty-${item.id}`}
                      >
                        <Minus className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(item.id, 1)}
                        className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-[#EAE0D5]"
                        data-testid={`increase-qty-${item.id}`}
                      >
                        <Plus className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-[#EAE0D5] pt-4 mt-4">
                <div className="flex justify-between text-lg font-medium mb-4">
                  <span>Total</span>
                  <span className="text-[#D05A45]">${cartTotal.toFixed(2)}</span>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-[#3B2E2A] mb-1">Delivery Address *</label>
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setDeliveryAddress(e.target.value)}
                      placeholder="Enter your delivery address"
                      className="w-full hp-input px-4 py-3"
                      data-testid="delivery-address-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#3B2E2A] mb-1">Notes (optional)</label>
                    <input
                      type="text"
                      value={orderNotes}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setOrderNotes(e.target.value)}
                      placeholder="Any special instructions?"
                      className="w-full hp-input px-4 py-3"
                      data-testid="order-notes-input"
                    />
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <button
                  onClick={() => setShowOrderDialog(false)}
                  className="hp-btn-secondary"
                >
                  Continue Shopping
                </button>
                <button
                  onClick={placeOrder}
                  disabled={orderLoading || !deliveryAddress.trim()}
                  className="hp-btn-primary flex items-center gap-2 disabled:opacity-50"
                  data-testid="place-order-btn"
                >
                  {orderLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    'Place Order'
                  )}
                </button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Item Details Dialog */}
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedItem && (
            <>
              <img 
                src={selectedItem.image_url || 'https://images.pexels.com/photos/7111387/pexels-photo-7111387.jpeg'} 
                alt={selectedItem.name}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
              <DialogHeader>
                <DialogTitle className="font-heading text-2xl">{selectedItem.name}</DialogTitle>
                <DialogDescription>{selectedItem.description}</DialogDescription>
              </DialogHeader>
              
              <div className="flex items-center gap-4 my-4">
                <span className="text-2xl font-semibold text-[#D05A45]">${selectedItem.price.toFixed(2)}</span>
                <span className="hp-badge">{selectedItem.category}</span>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-[#E89B27] text-[#E89B27]" strokeWidth={1.5} />
                  <span className="font-medium">{selectedItem.avg_rating.toFixed(1)}</span>
                </div>
              </div>
              
              <p className="text-sm text-[#75635C]">By {selectedItem.seller_name}</p>
              
              <div className="border-t border-[#EAE0D5] my-4 pt-4">
                <h4 className="font-heading text-lg font-medium mb-4">Reviews ({reviews.length})</h4>
                
                {reviews.length === 0 ? (
                  <p className="text-sm text-[#75635C]">No reviews yet. Be the first to review!</p>
                ) : (
                  <div className="space-y-3 max-h-40 overflow-y-auto mb-4">
                    {reviews.map(review => (
                      <div key={review.id} className="bg-[#F5EFE6] p-3 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{review.customer_name}</span>
                          <div className="flex items-center"> 
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-3 h-3 ${i < review.rating ? 'fill-[#E89B27] text-[#E89B27]' : 'text-[#EAE0D5]'}`} 
                                strokeWidth={1.5} 
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-[#75635C]">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="border-t border-[#EAE0D5] pt-4">
                  <h5 className="font-medium mb-3">Write a Review</h5>
                  <div className="flex items-center gap-2 mb-3">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                        className="p-1"
                        data-testid={`rating-star-${star}`}
                      >
                        <Star 
                          className={`w-6 h-6 ${star <= newReview.rating ? 'fill-[#E89B27] text-[#E89B27]' : 'text-[#EAE0D5]'}`} 
                          strokeWidth={1.5} 
                        />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={newReview.comment}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                    placeholder="Share your experience..."
                    className="w-full hp-input px-4 py-3 min-h-[80px] resize-none"
                    data-testid="review-comment-input"
                  />
                  <button
                    onClick={submitReview}
                    disabled={reviewLoading}
                    className="mt-3 hp-btn-primary w-full flex items-center justify-center gap-2"
                    data-testid="submit-review-btn"
                  >
                    {reviewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Submit Review
                  </button>
                </div>
              </div>
              
              <button
                onClick={() => {
                  addToCart(selectedItem);
                  setShowItemDialog(false);
                }}
                className="w-full hp-btn-primary mt-4"
                data-testid="dialog-add-to-cart-btn"
              >
                Add to Cart - ${selectedItem.price.toFixed(2)}
              </button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerDashboard;