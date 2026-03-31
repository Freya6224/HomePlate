import React, { useState, useEffect, useCallback, ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { FoodItem, Order, OrderStatus } from '../types';
import { 
  ChefHat, Plus, Edit2, Trash2, LogOut, Package, 
  Loader2, DollarSign, ShoppingBag
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Toaster, toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CATEGORIES: string[] = ['Main Course', 'Appetizer', 'Dessert', 'Beverage', 'Snacks', 'Breakfast', 'Lunch', 'Dinner'];

const FOOD_IMAGES: string[] = [
  "https://images.pexels.com/photos/7111387/pexels-photo-7111387.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  "https://images.pexels.com/photos/29075346/pexels-photo-29075346.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  "https://images.unsplash.com/photo-1625938144755-652e08e359b7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwzfHxydXN0aWMlMjBmb29kJTIwc3ByZWFkfGVufDB8fHx8MTc3NDgzODY1OXww&ixlib=rb-4.1.0&q=85",
  "https://images.unsplash.com/photo-1686431984279-861a8d22c5f2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHwxfHxiYWtpbmclMjBmcmVzaCUyMGJyZWFkfGVufDB8fHx8MTc3NDgzODY2Mnww&ixlib=rb-4.1.0&q=85"
];

interface ItemForm {
  name: string;
  description: string;
  price: string;
  category: string;
  is_available: boolean;
  image_url: string;
}

const SellerDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<string>('menu');
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  const [showItemDialog, setShowItemDialog] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [itemForm, setItemForm] = useState<ItemForm>({
    name: '',
    description: '',
    price: '',
    category: 'Main Course',
    is_available: true,
    image_url: ''
  });
  const [formLoading, setFormLoading] = useState<boolean>(false);
  
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<FoodItem | null>(null);

  const fetchData = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const [itemsRes, ordersRes] = await Promise.all([
        axios.get<FoodItem[]>(`${API_URL}/api/my-food-items`, { withCredentials: true }),
        axios.get<Order[]>(`${API_URL}/api/orders`, { withCredentials: true })
      ]);
      setFoodItems(itemsRes.data);
      setOrders(ordersRes.data);
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

  const openAddDialog = (): void => {
    setEditingItem(null);
    setItemForm({
      name: '',
      description: '',
      price: '',
      category: 'Main Course',
      is_available: true,
      image_url: FOOD_IMAGES[Math.floor(Math.random() * FOOD_IMAGES.length)]
    });
    setShowItemDialog(true);
  };

  const openEditDialog = (item: FoodItem): void => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: item.category,
      is_available: item.is_available,
      image_url: item.image_url || ''
    });
    setShowItemDialog(true);
  };

  const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setItemForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!itemForm.name.trim() || !itemForm.description.trim() || !itemForm.price) {
      toast.error('Please fill all required fields');
      return;
    }
    
    const price = parseFloat(itemForm.price);
    if (isNaN(price) || price <= 0) {
      toast.error('Please enter a valid price');
      return;
    }
    
    setFormLoading(true);
    try {
      const data = {
        name: itemForm.name.trim(),
        description: itemForm.description.trim(),
        price: price,
        category: itemForm.category,
        is_available: itemForm.is_available,
        image_url: itemForm.image_url || null
      };
      
      if (editingItem) {
        await axios.put(`${API_URL}/api/food-items/${editingItem.id}`, data, { withCredentials: true });
        toast.success('Item updated successfully');
      } else {
        await axios.post(`${API_URL}/api/food-items`, data, { withCredentials: true });
        toast.success('Item added successfully');
      }
      
      setShowItemDialog(false);
      fetchData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      const msg = err.response?.data?.detail || 'Failed to save item';
      toast.error(typeof msg === 'string' ? msg : 'Failed to save item');
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDelete = (item: FoodItem): void => {
    setItemToDelete(item);
    setShowDeleteDialog(true);
  };

  const handleDelete = async (): Promise<void> => {
    if (!itemToDelete) return;
    
    try {
      await axios.delete(`${API_URL}/api/food-items/${itemToDelete.id}`, { withCredentials: true });
      toast.success('Item deleted successfully');
      setShowDeleteDialog(false);
      setItemToDelete(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<void> => {
    try {
      await axios.put(`${API_URL}/api/orders/${orderId}/status?status=${status}`, {}, { withCredentials: true });
      toast.success('Order status updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

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

  const stats = {
    totalItems: foodItems.length,
    availableItems: foodItems.filter(i => i.is_available).length,
    pendingOrders: orders.filter(o => ['pending', 'confirmed', 'preparing'].includes(o.status)).length,
    totalRevenue: orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.total_amount, 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D05A45]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7]" data-testid="seller-dashboard">
      <Toaster position="top-right" richColors />
      
      <header className="sticky top-0 z-40 bg-[#FDFBF7]/90 backdrop-blur-md border-b border-[#EAE0D5]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#D05A45] rounded-full flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <span className="font-heading text-xl font-semibold text-[#3B2E2A]">Home Plate</span>
              <p className="text-xs text-[#75635C]">Seller Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-[#75635C] hidden sm:inline">Welcome, {user ? user.name : ''}</span>
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

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="hp-card p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#F5EFE6] rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-[#D05A45]" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-2xl font-semibold text-[#3B2E2A]">{stats.totalItems}</p>
                <p className="text-xs text-[#75635C]">Total Items</p>
              </div>
            </div>
          </div>
          <div className="hp-card p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#F5EFE6] rounded-xl flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-[#4A7C59]" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-2xl font-semibold text-[#3B2E2A]">{stats.availableItems}</p>
                <p className="text-xs text-[#75635C]">Available</p>
              </div>
            </div>
          </div>
          <div className="hp-card p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#F5EFE6] rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-[#E89B27]" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-2xl font-semibold text-[#3B2E2A]">{stats.pendingOrders}</p>
                <p className="text-xs text-[#75635C]">Active Orders</p>
              </div>
            </div>
          </div>
          <div className="hp-card p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#F5EFE6] rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-[#C07B46]" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-2xl font-semibold text-[#3B2E2A]">${stats.totalRevenue.toFixed(2)}</p>
                <p className="text-xs text-[#75635C]">Revenue</p>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <TabsList className="bg-[#F5EFE6] p-1 rounded-xl">
              <TabsTrigger 
                value="menu" 
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6"
                data-testid="menu-tab"
              >
                My Menu ({foodItems.length})
              </TabsTrigger>
              <TabsTrigger 
                value="orders"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6"
                data-testid="orders-tab"
              >
                Orders ({orders.length})
              </TabsTrigger>
            </TabsList>
            
            {activeTab === 'menu' && (
              <button
                onClick={openAddDialog}
                className="hp-btn-primary flex items-center gap-2"
                data-testid="add-item-btn"
              >
                <Plus className="w-5 h-5" strokeWidth={1.5} />
                Add Item
              </button>
            )}
          </div>

          <TabsContent value="menu" className="mt-0">
            {foodItems.length === 0 ? (
              <div className="text-center py-16 hp-card">
                <Package className="w-12 h-12 text-[#EAE0D5] mx-auto mb-4" strokeWidth={1.5} />
                <p className="text-[#75635C] mb-2">No items in your menu yet</p>
                <p className="text-sm text-[#75635C] mb-6">Start adding dishes to attract customers</p>
                <button
                  onClick={openAddDialog}
                  className="hp-btn-primary"
                  data-testid="add-first-item-btn"
                >
                  Add Your First Item
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {foodItems.map(item => (
                  <div key={item.id} className="hp-card overflow-hidden" data-testid={`menu-item-${item.id}`}>
                    <div className="relative aspect-[16/9]">
                      <img 
                        src={item.image_url || FOOD_IMAGES[0]} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      {!item.is_available && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="bg-red-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                            Unavailable
                          </span>
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <span className="hp-badge">{item.category}</span>
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-heading text-lg font-medium text-[#3B2E2A]">{item.name}</h3>
                        <span className="text-lg font-semibold text-[#D05A45]">${item.price.toFixed(2)}</span>
                      </div>
                      <p className="text-sm text-[#75635C] mb-4 line-clamp-2">{item.description}</p>
                      <div className="flex items-center justify-between pt-3 border-t border-[#EAE0D5]">
                        <div className="text-xs text-[#75635C]">
                          {item.review_count} reviews • {item.avg_rating.toFixed(1)} rating
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditDialog(item)}
                            className="w-9 h-9 rounded-lg bg-[#F5EFE6] flex items-center justify-center hover:bg-[#EAE0D5] transition-colors"
                            data-testid={`edit-item-${item.id}`}
                          >
                            <Edit2 className="w-4 h-4 text-[#3B2E2A]" strokeWidth={1.5} />
                          </button>
                          <button
                            onClick={() => confirmDelete(item)}
                            className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors"
                            data-testid={`delete-item-${item.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" strokeWidth={1.5} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders" className="mt-0">
            {orders.length === 0 ? (
              <div className="text-center py-16 hp-card">
                <ShoppingBag className="w-12 h-12 text-[#EAE0D5] mx-auto mb-4" strokeWidth={1.5} />
                <p className="text-[#75635C]">No orders yet</p>
                <p className="text-sm text-[#75635C] mt-1">Orders from customers will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.id} className="hp-card p-6" data-testid={`order-${order.id}`}>
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div>
                        <p className="text-sm text-[#75635C]">Order #{order.id.slice(-8)}</p>
                        <p className="font-heading text-lg font-medium text-[#3B2E2A]">
                          {order.customer_name}
                        </p>
                        <p className="text-sm text-[#75635C]">{order.delivery_address}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                        <span className="text-lg font-semibold text-[#D05A45]">
                          ${order.total_amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="border-t border-b border-[#EAE0D5] py-4 my-4">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm py-1">
                          <span className="text-[#3B2E2A]">{item.quantity}x {item.name}</span>
                          <span className="text-[#75635C]">${item.subtotal.toFixed(2)}</span>
                        </div>
                      ))}
                      {order.notes && (
                        <p className="text-sm text-[#75635C] mt-2 italic">Note: {order.notes}</p>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <p className="text-xs text-[#75635C]">
                        Ordered on {new Date(order.created_at).toLocaleString()}
                      </p>
                      
                      {!['delivered', 'cancelled'].includes(order.status) && (
                        <Select 
                          value={order.status} 
                          onValueChange={(value: string) => updateOrderStatus(order.id, value as OrderStatus)}
                        >
                          <SelectTrigger className="w-40 hp-input" data-testid={`status-select-${order.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="preparing">Preparing</SelectItem>
                            <SelectItem value="ready">Ready</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">
              {editingItem ? 'Edit Item' : 'Add New Item'}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update the details of your food item' : 'Add a new item to your menu'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#3B2E2A] mb-1">Name *</label>
              <input
                type="text"
                name="name"
                value={itemForm.name}
                onChange={handleFormChange}
                placeholder="e.g., Homemade Lasagna"
                className="w-full hp-input px-4 py-3"
                required
                data-testid="item-name-input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#3B2E2A] mb-1">Description *</label>
              <textarea
                name="description"
                value={itemForm.description}
                onChange={handleFormChange}
                placeholder="Describe your dish..."
                className="w-full hp-input px-4 py-3 min-h-[80px] resize-none"
                required
                data-testid="item-description-input"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#3B2E2A] mb-1">Price ($) *</label>
                <input
                  type="number"
                  name="price"
                  value={itemForm.price}
                  onChange={handleFormChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full hp-input px-4 py-3"
                  required
                  data-testid="item-price-input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#3B2E2A] mb-1">Category</label>
                <Select value={itemForm.category} onValueChange={(value: string) => setItemForm(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger className="hp-input" data-testid="item-category-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="is_available"
                id="is_available"
                checked={itemForm.is_available}
                onChange={handleFormChange}
                className="w-5 h-5 rounded border-[#EAE0D5] text-[#D05A45] focus:ring-[#D05A45]"
                data-testid="item-available-checkbox"
              />
              <label htmlFor="is_available" className="text-sm text-[#3B2E2A]">
                Available for ordering
              </label>
            </div>
            
            <DialogFooter className="gap-2">
              <button
                type="button"
                onClick={() => setShowItemDialog(false)}
                className="hp-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="hp-btn-primary flex items-center gap-2"
                data-testid="save-item-btn"
              >
                {formLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingItem ? 'Update Item' : 'Add Item'
                )}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Delete Item?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{itemToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <button
              onClick={() => setShowDeleteDialog(false)}
              className="hp-btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="bg-red-500 text-white rounded-full px-6 py-2 font-medium hover:bg-red-600 transition-colors"
              data-testid="confirm-delete-btn"
            >
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellerDashboard;