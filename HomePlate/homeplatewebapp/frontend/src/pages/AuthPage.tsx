
import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ChefHat, Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';

interface FormData {
  email: string;
  password: string;
  name: string;
}

const AuthPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, login, register } = useAuth();
  
  const initialMode = searchParams.get('mode') || 'login';
  const initialRole = searchParams.get('role') || 'customer';
  
  const [mode, setMode] = useState<string>(initialMode);
  const [role, setRole] = useState<string>(initialRole);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    name: ''
  });

  useEffect(() => {
    if (user) {
      const dashboard = user.role === 'seller' ? '/seller' : '/customer';
      navigate(dashboard);
    }
  }, [user, navigate]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    setLoading(true);

    let result;
    if (mode === 'login') {
      result = await login(formData.email, formData.password);
    } else {
      if (!formData.name.trim()) {
        setError('Name is required');
        setLoading(false);
        return;
      }
      result = await register(formData.email, formData.password, formData.name, role);
    }

    setLoading(false);
    if (!result.success) {
      setError(result.error || 'An error occurred');
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex">
      {/* Left side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-12">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-[#75635C] hover:text-[#D05A45] transition-colors mb-8 self-start"
          data-testid="back-to-home-btn"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
          Back to Home
        </button>
        
        <div className="max-w-md w-full mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-[#D05A45] rounded-full flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-white" strokeWidth={1.5} />
            </div>
            <span className="font-heading text-2xl font-semibold text-[#3B2E2A]">Home Plate</span>
          </div>
          
          <h1 className="font-heading text-3xl font-semibold text-[#3B2E2A] mb-2">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-[#75635C] mb-8">
            {mode === 'login' 
              ? 'Sign in to access your dashboard' 
              : `Join as a ${role === 'seller' ? 'seller' : 'customer'} today`}
          </p>

          {/* Mode Toggle */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                mode === 'login' 
                  ? 'bg-[#D05A45] text-white' 
                  : 'bg-[#F5EFE6] text-[#3B2E2A] hover:bg-[#EAE0D5]'
              }`}
              data-testid="login-mode-btn"
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                mode === 'register' 
                  ? 'bg-[#D05A45] text-white' 
                  : 'bg-[#F5EFE6] text-[#3B2E2A] hover:bg-[#EAE0D5]'
              }`}
              data-testid="register-mode-btn"
            >
              Register
            </button>
          </div>

          {/* Role Selection for Register */}
          {mode === 'register' && (
            <div className="mb-6">
              <span className="hp-label block mb-3">I want to</span>
              <Tabs value={role} onValueChange={setRole} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-[#F5EFE6] p-1 rounded-xl">
                  <TabsTrigger 
                    value="customer" 
                    className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#3B2E2A] data-[state=active]:shadow-sm"
                    data-testid="role-customer-tab"
                  >
                    Order Food
                  </TabsTrigger>
                  <TabsTrigger 
                    value="seller"
                    className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#3B2E2A] data-[state=active]:shadow-sm"
                    data-testid="role-seller-tab"
                  >
                    Sell Food
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm" data-testid="auth-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-[#3B2E2A] mb-2">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your name"
                  className="w-full hp-input px-4 py-3"
                  required
                  data-testid="name-input"
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-[#3B2E2A] mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                className="w-full hp-input px-4 py-3"
                required
                data-testid="email-input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#3B2E2A] mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  className="w-full hp-input px-4 py-3 pr-12"
                  required
                  minLength={6}
                  data-testid="password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#75635C] hover:text-[#3B2E2A]"
                  data-testid="toggle-password-btn"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" strokeWidth={1.5} /> : <Eye className="w-5 h-5" strokeWidth={1.5} />}
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full hp-btn-primary py-4 flex items-center justify-center gap-2 disabled:opacity-70"
              data-testid="submit-auth-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                mode === 'login' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-[#75635C]">
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-[#D05A45] font-medium hover:underline"
              data-testid="switch-mode-link"
            >
              {mode === 'login' ? 'Register' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
      
      {/* Right side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img 
          src="https://images.unsplash.com/photo-1771339140293-c862ee266385?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTB8MHwxfHNlYXJjaHwxfHxwZXJzb24lMjBjb29raW5nJTIwbWVhbHxlbnwwfHx8fDE3NzQ4Mzg2NjJ8MA&ixlib=rb-4.1.0&q=85"
          alt="Cooking"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#3B2E2A]/60 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <blockquote className="font-heading text-2xl font-medium mb-4">
            "The best meals are the ones made with love at home"
          </blockquote>
          <p className="text-white/80">- Home Plate Community</p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
