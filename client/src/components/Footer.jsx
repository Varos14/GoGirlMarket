import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-20 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          {/* Brand Col */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="text-2xl font-heading font-black tracking-tighter text-primary">
              GOGIRL<span className="text-secondary">MARKET</span>
            </Link>
            <p className="mt-4 text-gray-500 text-sm leading-relaxed">
              Empowering women through commerce. Discover unique fashion, beauty, and lifestyle products from women-owned businesses across the globe.
            </p>
            <div className="flex gap-4 mt-6">
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>
            </div>
          </div>

          {/* Links Col 1 */}
          <div>
            <h3 className="font-heading font-bold text-gray-900 mb-4 uppercase text-sm tracking-wider">Shop</h3>
            <ul className="space-y-3">
              <li><Link to="/shop?sort=newest" className="text-gray-500 hover:text-primary transition-colors text-sm">New Arrivals</Link></li>
              <li><Link to="/shop?sort=bestsellers" className="text-gray-500 hover:text-primary transition-colors text-sm">Best Sellers</Link></li>
              <li><Link to="/shop?category=Fashion" className="text-gray-500 hover:text-primary transition-colors text-sm">Fashion</Link></li>
              <li><Link to="/shop?category=Beauty" className="text-gray-500 hover:text-primary transition-colors text-sm">Beauty & Skincare</Link></li>
            </ul>
          </div>

          {/* Links Col 2 */}
          <div>
            <h3 className="font-heading font-bold text-gray-900 mb-4 uppercase text-sm tracking-wider">Support</h3>
            <ul className="space-y-3">
              <li><Link to="/contact" className="text-gray-500 hover:text-primary transition-colors text-sm">Contact Us</Link></li>
              <li><Link to="/shipping-returns" className="text-gray-500 hover:text-primary transition-colors text-sm">Shipping & Returns</Link></li>
              <li><Link to="/faq" className="text-gray-500 hover:text-primary transition-colors text-sm">FAQ</Link></li>
              <li><Link to="/profile" className="text-gray-500 hover:text-primary transition-colors text-sm">Track Order</Link></li>
            </ul>
          </div>

          {/* Newsletter Col */}
          <div className="col-span-1 md:col-span-1">
            <h3 className="font-heading font-bold text-gray-900 mb-4 uppercase text-sm tracking-wider">Join the Sisterhood</h3>
            <p className="text-gray-500 text-sm mb-4">
              Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.
            </p>
            <form className="flex" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="w-full px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
              />
              <button 
                type="submit" 
                className="bg-primary text-white px-4 py-2 rounded-r-md font-bold text-sm hover:bg-secondary transition-colors"
              >
                Join
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm flex items-center gap-1">
            © {new Date().getFullYear()} GoGirl Market. Made with <Heart size={14} className="text-secondary fill-secondary" /> by Women.
          </p>
          <div className="flex gap-6">
            <Link to="/privacy" className="text-gray-400 hover:text-primary text-sm transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-gray-400 hover:text-primary text-sm transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
