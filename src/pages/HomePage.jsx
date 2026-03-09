import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, Utensils, Clock, Star, MapPin, Phone, Mail, ArrowRight, Menu, X } from 'lucide-react';
import logo from '../assets/logo3.png'; // Ensure you have a logo image in the specified path

export default function HomePage() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const features = [
    {
      icon: <Utensils className="w-8 h-8" />,
      title: "Delicious Food",
      description: "Authentic Filipino cuisine made with love and fresh ingredients"
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Fast Service",
      description: "Quick and efficient service without compromising quality"
    },
    {
      icon: <Star className="w-8 h-8" />,
      title: "Quality Assured",
      description: "Only the finest ingredients in every dish we serve"
    },
    {
      icon: <ChefHat className="w-8 h-8" />,
      title: "Expert Chefs",
      description: "Experienced chefs dedicated to perfecting every meal"
    }
  ];

  const popularDishes = [
    { name: "Spaghetti with Toasted Bread", price: "₱150", image: "/images/spaghetti.jpg" },
    { name: "Chicken Lomi", price: "₱200", image: "/images/chicken-lomi.jpg" },
    { name: "Pancit Guisado", price: "₱250", image: "/images/pancit.jpg" },
    { name: "Lechon Kawali", price: "₱260", image: "/images/lechon.jpg" }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Logo & Navigation - Single Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 md:px-6 py-4 md:py-6">
          <div className="flex items-center justify-between">
            {/* Logo on Left */}
            <img 
              src={logo} 
              alt="App Logo" 
              className="h-10 md:h-12 object-contain"
            />
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#home" className="text-gray-700 hover:text-emerald-700 transition-colors">Home</a>
              <a href="#menu" className="text-gray-700 hover:text-emerald-700 transition-colors">Menu</a>
              <a href="#about" className="text-gray-700 hover:text-emerald-700 transition-colors">About</a>
              <a href="#contact" className="text-gray-700 hover:text-emerald-700 transition-colors">Contact</a>
              <button 
                onClick={() => navigate('/login')}
                className="px-6 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-colors font-semibold"
              >
                Login
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation Menu */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-gray-200">
              <div className="flex flex-col space-y-4 pt-4">
                <a href="#home" className="text-gray-700 hover:text-emerald-700 transition-colors" onClick={() => setIsMenuOpen(false)}>Home</a>
                <a href="#menu" className="text-gray-700 hover:text-emerald-700 transition-colors" onClick={() => setIsMenuOpen(false)}>Menu</a>
                <a href="#about" className="text-gray-700 hover:text-emerald-700 transition-colors" onClick={() => setIsMenuOpen(false)}>About</a>
                <a href="#contact" className="text-gray-700 hover:text-emerald-700 transition-colors" onClick={() => setIsMenuOpen(false)}>Contact</a>
                <button 
                  onClick={() => {
                    navigate('/login');
                    setIsMenuOpen(false);
                  }}
                  className="px-6 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-colors font-semibold text-left"
                >
                  Login
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="relative bg-gradient-to-br from-emerald-50 to-emerald-100 py-16 md:py-20 lg:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="flex-1 space-y-4 md:space-y-6 text-center md:text-left">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Welcome to <span className="text-emerald-700">Food Paradise</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto md:mx-0">
                Experience the authentic taste of Filipino cuisine. Fresh ingredients, 
                traditional recipes, and a passion for great food.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <button 
                  onClick={() => window.open('your-apk-download-link-here', '_blank')}
                  className="px-6 md:px-8 py-3 md:py-4 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-colors font-semibold text-base md:text-lg flex items-center justify-center gap-2"
                >
                  Download the Mobile App
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 mt-8 md:mt-0">
              <div className="relative">
                <div className="w-full h-64 md:h-80 lg:h-96 bg-gradient-to-br from-emerald-200 to-emerald-300 rounded-2xl md:rounded-3xl shadow-2xl flex items-center justify-center">
                  <Utensils className="w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 text-emerald-700 opacity-20" />
                </div>
                {/* Floating Cards */}
                <div className="absolute -top-4 -right-4 md:-top-6 md:-right-6 bg-white p-3 md:p-4 rounded-xl shadow-xl">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 md:w-6 md:h-6 text-yellow-400 fill-yellow-400" />
                    <div>
                      <p className="font-bold text-gray-900 text-sm md:text-base">4.9/5</p>
                      <p className="text-xs text-gray-500">Rating</p>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-4 -left-4 md:-bottom-6 md:-left-6 bg-white p-3 md:p-4 rounded-xl shadow-xl">
                  <div className="flex items-center gap-2">
                    <ChefHat className="w-5 h-5 md:w-6 md:h-6 text-emerald-700" />
                    <div>
                      <p className="font-bold text-gray-900 text-sm md:text-base">50+</p>
                      <p className="text-xs text-gray-500">Menu Items</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Choose Us</h2>
            <p className="text-lg md:text-xl text-gray-600">Experience the difference at Food Paradise</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-4 md:p-6 rounded-xl hover:shadow-xl transition-shadow bg-gray-50">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 text-emerald-700">
                  {feature.icon}
                </div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm md:text-base text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Dishes */}
      <section id="menu" className="py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Popular Dishes</h2>
            <p className="text-lg md:text-xl text-gray-600">Try our customer favorites</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {popularDishes.map((dish, index) => (
              <div key={index} className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow">
                <div className="h-40 md:h-48 bg-gradient-to-br from-emerald-200 to-emerald-300 flex items-center justify-center">
                  <Utensils className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 text-emerald-700 opacity-20" />
                </div>
                <div className="p-4 md:p-6">
                  <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2">{dish.name}</h3>
                  <p className="text-xl md:text-2xl font-bold text-emerald-700">{dish.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col lg:flex-row items-center gap-8 md:gap-12">
            <div className="flex-1">
              <div className="w-full h-64 md:h-80 lg:h-96 bg-gradient-to-br from-emerald-200 to-emerald-300 rounded-2xl md:rounded-3xl shadow-2xl flex items-center justify-center">
                <ChefHat className="w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 text-emerald-700 opacity-20" />
              </div>
            </div>
            <div className="flex-1 space-y-4 md:space-y-6 text-center lg:text-left">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">About Food Paradise</h2>
              <p className="text-base md:text-lg text-gray-600 leading-relaxed">
                Food Paradise has been serving delicious Filipino cuisine since 2020. 
                Our commitment to quality, authenticity, and customer satisfaction has made us 
                a beloved destination for food lovers.
              </p>
              <p className="text-base md:text-lg text-gray-600 leading-relaxed">
                We use only the freshest ingredients and traditional cooking methods to bring 
                you the authentic taste of Filipino home cooking. Every dish is prepared with 
                love and attention to detail.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 md:gap-6 pt-4">
                <div className="text-center">
                  <p className="text-2xl md:text-3xl font-bold text-emerald-700">5+</p>
                  <p className="text-sm md:text-base text-gray-600">Years</p>
                </div>
                <div className="hidden sm:block w-px h-12 bg-gray-300"></div>
                <div className="text-center">
                  <p className="text-2xl md:text-3xl font-bold text-emerald-700">10K+</p>
                  <p className="text-sm md:text-base text-gray-600">Happy Customers</p>
                </div>
                <div className="hidden sm:block w-px h-12 bg-gray-300"></div>
                <div className="text-center">
                  <p className="text-2xl md:text-3xl font-bold text-emerald-700">50+</p>
                  <p className="text-sm md:text-base text-gray-600">Menu Items</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 md:py-20 bg-emerald-700 text-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Get In Touch</h2>
            <p className="text-lg md:text-xl text-emerald-100">We'd love to hear from you</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                <MapPin className="w-6 h-6 md:w-8 md:h-8" />
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-2">Location</h3>
              <p className="text-sm md:text-base text-emerald-100">123 Main Street<br />City, Philippines</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                <Phone className="w-6 h-6 md:w-8 md:h-8" />
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-2">Phone</h3>
              <p className="text-sm md:text-base text-emerald-100">+63 123 456 7890</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                <Mail className="w-6 h-6 md:w-8 md:h-8" />
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-2">Email</h3>
              <p className="text-sm md:text-base text-emerald-100">info@foodparadise.com</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 md:py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
            </div>
            <div className="text-center md:text-right">
              <p className="text-gray-400 text-sm md:text-base">© 2026 Food Paradise. All rights reserved.</p>
              <p className="text-gray-400 text-xs md:text-sm mt-1">
                Brought to you by CodeStrive Systems, a WMSU CCS Student Company Group
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}