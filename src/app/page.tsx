'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Menu, X, Calendar, CheckCircle, Bell, ArrowRight, Building2, LogIn, UserPlus, Shield, Clock, FileText } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (token) {
      router.push(role === 'admin' ? '/admin/dashboard' : '/employee/dashboard');
    }
  }, [router]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Home', href: '#hero' },
    { name: 'Features', href: '#features' },
  ];

  const features = [
    {
      icon: Calendar,
      title: 'Request Leave',
      description: 'Submit leave requests with ease. Specify dates, leave type, and add supporting details for quick approval.',
      color: 'primary',
    },
    {
      icon: CheckCircle,
      title: 'Track Leave Status',
      description: 'Monitor your leave requests in real-time. Get instant updates on approval status and decision timelines.',
      color: 'success',
    },
    {
      icon: Bell,
      title: 'Notifications',
      description: 'Stay informed with timely notifications about your leave requests, approvals, and important updates.',
      color: 'secondary',
    },
    {
      icon: ArrowRight,
      title: 'Return-to-Duty Tracking',
      description: 'Track your return-to-duty dates and ensure smooth transitions back to work with automated reminders.',
      color: 'warning',
    },
  ];

  return (
    <div className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat relative" style={{ backgroundImage: "url('/wallpaper.png')" }}>
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-white/90"></div>
      
      {/* Content wrapper to appear above overlay */}
      <div className="relative z-10">
      
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm' : 'bg-white/80 backdrop-blur-lg border-b border-slate-100'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg group-hover:shadow-xl transition-all">
                <img src="/wallpaper.png" alt="Maranova Logo" className="w-full h-full object-cover" />
              </div>
              <span className="font-bold text-slate-900 text-xl tracking-tight">Maranova</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-10">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-slate-600 hover:text-blue-600 font-medium transition-colors relative group"
                >
                  {item.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full"></span>
                </a>
              ))}
            </div>

            {/* Desktop CTA Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/admin/login"
                className="text-slate-600 hover:text-blue-600 font-medium text-sm transition-colors flex items-center gap-1.5"
              >
                <Shield className="w-4 h-4" />
                Admin Portal
              </Link>
              <Link
                href="/register"
                className="px-5 py-2.5 text-slate-700 hover:bg-slate-100 rounded-xl font-medium transition-all border border-slate-200 hover:border-slate-300"
              >
                Register
              </Link>
              <Link
                href="/login"
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Employee Login
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl hover:bg-slate-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-slate-700" /> : <Menu className="w-6 h-6 text-slate-700" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 shadow-lg">
            <div className="px-4 py-6 space-y-4">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="block text-slate-700 hover:text-blue-600 font-medium py-3 px-4 rounded-lg hover:bg-slate-50 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <Link
                  href="/admin/login"
                  className="flex items-center gap-2 text-slate-700 hover:text-blue-600 font-medium py-3 px-4 rounded-lg hover:bg-slate-50 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Shield className="w-4 h-4" />
                  Admin Portal
                </Link>
                <Link
                  href="/register"
                  className="block text-slate-700 hover:text-blue-600 font-medium py-3 px-4 rounded-lg hover:bg-slate-50 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Register
                </Link>
                <Link
                  href="/login"
                  className="block w-full text-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-medium transition-all shadow-lg flex items-center justify-center gap-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LogIn className="w-4 h-4" />
                  Employee Login
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="hero" className="pt-40 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-5 py-2.5 rounded-full text-sm font-semibold mb-8 border border-blue-100">
              <Building2 className="w-4 h-4" />
              <span>HR Leave Management</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 mb-8 leading-tight tracking-tight">
              Employee Leave Management System
            </h1>
            
            <p className="text-xl sm:text-2xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
              Manage leave requests, track approvals, monitor return-to-duty status, and stay informed through a secure employee portal.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl font-semibold transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-3 text-lg"
              >
                <LogIn className="w-5 h-5" />
                <span>Employee Login</span>
              </Link>
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-200 hover:border-slate-300 rounded-2xl font-semibold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 text-lg"
              >
                <UserPlus className="w-5 h-5" />
                <span>Register</span>
              </Link>
            </div>

            <p className="text-base text-slate-500">
              Administrator? <Link href="/admin/login" className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1.5 transition-colors">Access Admin Portal <ArrowRight className="w-4 h-4" /></Link>
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
              Everything You Need
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Streamline your leave management with powerful features designed for efficiency, clarity, and seamless user experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const colorClasses: Record<string, { bg: string; border: string; iconBg: string; iconColor: string }> = {
                primary: {
                  bg: 'from-blue-50 to-white',
                  border: 'border-blue-100 hover:border-blue-300',
                  iconBg: 'bg-blue-100 group-hover:bg-blue-200',
                  iconColor: 'text-blue-600',
                },
                success: {
                  bg: 'from-emerald-50 to-white',
                  border: 'border-emerald-100 hover:border-emerald-300',
                  iconBg: 'bg-emerald-100 group-hover:bg-emerald-200',
                  iconColor: 'text-emerald-600',
                },
                secondary: {
                  bg: 'from-violet-50 to-white',
                  border: 'border-violet-100 hover:border-violet-300',
                  iconBg: 'bg-violet-100 group-hover:bg-violet-200',
                  iconColor: 'text-violet-600',
                },
                warning: {
                  bg: 'from-amber-50 to-white',
                  border: 'border-amber-100 hover:border-amber-300',
                  iconBg: 'bg-amber-100 group-hover:bg-amber-200',
                  iconColor: 'text-amber-600',
                },
              };

              const colors = colorClasses[feature.color];

              return (
                <div
                  key={index}
                  className="group p-8 bg-gradient-to-br from-white to-slate-50 rounded-3xl border border-slate-200 hover:border-blue-300 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className={`w-14 h-14 ${colors.iconBg} rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300`}>
                    <feature.icon className={`w-7 h-7 ${colors.iconColor}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 tracking-tight">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-slate-300 mb-10 leading-relaxed">
            Join thousands of organizations streamlining their leave management process with our secure, enterprise-grade platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-100 text-slate-900 rounded-2xl font-semibold transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-3 text-lg"
            >
              <UserPlus className="w-5 h-5" />
              <span>Create Account</span>
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 bg-transparent hover:bg-slate-800 text-white border-2 border-slate-600 hover:border-slate-500 rounded-2xl font-semibold transition-all flex items-center justify-center gap-3 text-lg"
            >
              <LogIn className="w-5 h-5" />
              <span>Sign In</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg">
                <img src="/wallpaper.png" alt="Maranova Logo" className="w-full h-full object-cover" />
              </div>
              <span className="font-bold text-xl tracking-tight">maranova system</span>
            </div>
            <p className="text-slate-400 text-sm">
              HR Leave Management System
            </p>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-800 text-center">
            <p className="text-slate-500 text-sm">
              software designed and developed by NOVATECH SYSTEM. All rights reserved. &copy; {new Date().getFullYear()} 
               
            </p>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}