import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, Users, ArrowRight, Star, Clock, MapPin } from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[#FDFBF7]/90 backdrop-blur-md border-b border-[#EAE0D5]" data-testid="landing-nav">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-24 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#D05A45] rounded-full flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-white" strokeWidth={1.5} />
            </div>
            <span className="font-heading text-2xl font-semibold text-[#3B2E2A]">Home Plate</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/auth')}
              className="text-[#75635C] hover:text-[#D05A45] font-medium transition-colors"
              data-testid="nav-login-btn"
            >
              Sign In
            </button>
            <button 
              onClick={() => navigate('/auth?mode=register')}
              className="hp-btn-primary text-sm px-6 py-2"
              data-testid="nav-register-btn"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden" data-testid="hero-section">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1764271701524-e43c70689067?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHw0fHxydXN0aWMlMjBmb29kJTIwc3ByZWFkfGVufDB8fHx8MTc3NDgzODY1OXww&ixlib=rb-4.1.0&q=85"
            alt="Rustic food spread"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#3B2E2A]/80 to-[#3B2E2A]/40" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-12 lg:px-24 py-24 lg:py-32">
          <div className="max-w-2xl">
            <span className="hp-label mb-4 inline-block">Homemade with love</span>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-white mb-6 leading-tight">
              Taste of Home,<br />Delivered to You
            </h1>
            <p className="text-lg text-white/80 mb-8 leading-relaxed max-w-xl">
              Connect with local home chefs and discover authentic homemade meals. 
              Perfect for students and professionals missing the comfort of home-cooked food.
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => navigate('/auth?mode=register&role=customer')}
                className="hp-btn-primary flex items-center gap-2"
                data-testid="hero-customer-btn"
              >
                <Users className="w-5 h-5" strokeWidth={1.5} />
                I'm a Customer
                <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </button>
              <button 
                onClick={() => navigate('/auth?mode=register&role=seller')}
                className="bg-white/10 backdrop-blur text-white rounded-full px-8 py-3 font-medium hover:bg-white/20 transition-colors flex items-center gap-2 border border-white/20"
                data-testid="hero-seller-btn"
              >
                <ChefHat className="w-5 h-5" strokeWidth={1.5} />
                I'm a Seller
                <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-28" data-testid="features-section">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-24">
          <div className="text-center mb-16">
            <span className="hp-label mb-4 inline-block">Why Home Plate?</span>
            <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-medium tracking-tight text-[#3B2E2A]">
              The Best of Both Worlds
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="hp-card hp-card-hover p-8">
              <div className="w-14 h-14 bg-[#F5EFE6] rounded-2xl flex items-center justify-center mb-6">
                <Star className="w-7 h-7 text-[#D05A45]" strokeWidth={1.5} />
              </div>
              <h3 className="font-heading text-xl font-medium text-[#3B2E2A] mb-3">Authentic Home Cooking</h3>
              <p className="text-[#75635C] leading-relaxed">
                Discover dishes made with love by local home chefs. Each meal tells a story of tradition and care.
              </p>
            </div>
            
            <div className="hp-card hp-card-hover p-8">
              <div className="w-14 h-14 bg-[#F5EFE6] rounded-2xl flex items-center justify-center mb-6">
                <MapPin className="w-7 h-7 text-[#D05A45]" strokeWidth={1.5} />
              </div>
              <h3 className="font-heading text-xl font-medium text-[#3B2E2A] mb-3">Local & Fresh</h3>
              <p className="text-[#75635C] leading-relaxed">
                Support home businesses in your area. Fresh ingredients, shorter delivery times, happier community.
              </p>
            </div>
            
            <div className="hp-card hp-card-hover p-8">
              <div className="w-14 h-14 bg-[#F5EFE6] rounded-2xl flex items-center justify-center mb-6">
                <Clock className="w-7 h-7 text-[#D05A45]" strokeWidth={1.5} />
              </div>
              <h3 className="font-heading text-xl font-medium text-[#3B2E2A] mb-3">Easy Ordering</h3>
              <p className="text-[#75635C] leading-relaxed">
                Browse, favorite, and order with ease. Track your meals and leave reviews to help others find great food.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Split Section */}
      <section className="py-20 lg:py-28 bg-[#F5EFE6]" data-testid="split-section">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="order-2 lg:order-1">
              <span className="hp-label mb-4 inline-block">For Sellers</span>
              <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-medium tracking-tight text-[#3B2E2A] mb-6">
                Turn Your Passion Into Business
              </h2>
              <p className="text-[#75635C] leading-relaxed mb-8">
                Share your culinary talents with hungry customers. Manage your menu, track orders, 
                and grow your home food business with our simple dashboard.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-[#3B2E2A]">
                  <div className="w-6 h-6 rounded-full bg-[#4A7C59] flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  Easy menu management
                </li>
                <li className="flex items-center gap-3 text-[#3B2E2A]">
                  <div className="w-6 h-6 rounded-full bg-[#4A7C59] flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  Real-time order tracking
                </li>
                <li className="flex items-center gap-3 text-[#3B2E2A]">
                  <div className="w-6 h-6 rounded-full bg-[#4A7C59] flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  Build your customer base
                </li>
              </ul>
              <button 
                onClick={() => navigate('/auth?mode=register&role=seller')}
                className="hp-btn-primary flex items-center gap-2"
                data-testid="section-seller-btn"
              >
                Start Selling Today
                <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
            <div className="order-1 lg:order-2">
              <div className="relative">
                <img 
                  src="https://images.pexels.com/photos/11121658/pexels-photo-11121658.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
                  alt="Delicious food spread"
                  className="rounded-2xl shadow-2xl w-full object-cover aspect-[4/3]"
                />
                <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-lg p-4 hidden sm:block">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#F5EFE6] rounded-full flex items-center justify-center">
                      <ChefHat className="w-6 h-6 text-[#D05A45]" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="font-medium text-[#3B2E2A]">500+</p>
                      <p className="text-sm text-[#75635C]">Home Chefs</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28" data-testid="cta-section">
        <div className="max-w-4xl mx-auto px-6 sm:px-12 lg:px-24 text-center">
          <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-medium tracking-tight text-[#3B2E2A] mb-6">
            Ready to Experience Home Cooking?
          </h2>
          <p className="text-lg text-[#75635C] mb-8 max-w-2xl mx-auto">
            Join thousands of food lovers and home chefs on Home Plate. 
            Your next favorite meal is just a click away.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button 
              onClick={() => navigate('/auth?mode=register&role=customer')}
              className="hp-btn-primary flex items-center gap-2"
              data-testid="cta-customer-btn"
            >
              Join as Customer
            </button>
            <button 
              onClick={() => navigate('/auth?mode=register&role=seller')}
              className="hp-btn-secondary flex items-center gap-2"
              data-testid="cta-seller-btn"
            >
              Join as Seller
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#EAE0D5] py-12" data-testid="footer">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-24">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#D05A45] rounded-full flex items-center justify-center">
                <ChefHat className="w-4 h-4 text-white" strokeWidth={1.5} />
              </div>
              <span className="font-heading text-lg font-semibold text-[#3B2E2A]">Home Plate</span>
            </div>
            <p className="text-sm text-[#75635C]">
              © 2024 Home Plate. Made with love for food lovers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;