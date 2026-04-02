'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'buyer' | 'seller' | 'admin';
  isVerified: boolean;
  profile_photo?: string;
  subscription: {
    plan: 'free' | 'seller' | 'premium';
    status: 'pending' | 'active' | 'expired';
    commissionRate?: number;
  };
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithToken: (accessToken: string, refreshToken: string) => Promise<void>;
  register: (name: string, email: string, phone: string, password: string, plan?: string) => Promise<{ userId: string }>;
  verifyOTP: (userId: string, otp: string) => Promise<void>;
  activateSubscription: (userId: string, plan: string, paymentMethod?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  pendingUser: { id: string; name: string; email: string; phone: string; plan: string } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [pendingUser, setPendingUser] = useState<{ id: string; name: string; email: string; phone: string; plan: string } | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      // Re-fetch from backend to get latest is_verified status
      setTimeout(() => refreshUser(), 100);
    }
    const savedPending = localStorage.getItem('pendingUser');
    if (savedPending) {
      setPendingUser(JSON.parse(savedPending));
    }

    // Listen for user updates (e.g., profile photo changes)
    const handleUserUpdate = () => {
      const updatedUser = localStorage.getItem('user');
      if (updatedUser) {
        setUser(JSON.parse(updatedUser));
      }
    };

    // Listen for both storage events (from other tabs) and custom events (same tab)
    window.addEventListener('storage', handleUserUpdate);
    window.addEventListener('userUpdated', handleUserUpdate);
    
    return () => {
      window.removeEventListener('storage', handleUserUpdate);
      window.removeEventListener('userUpdated', handleUserUpdate);
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.login({ email, password });
      
      if (response.success && response.data) {
        const userData = response.data.user;
        const token = response.data.accessToken;
        
        const loggedInUser: User = {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          role: userData.role,
          isVerified: userData.isVerified,
          profile_photo: userData.profile_photo,
          subscription: {
            plan: userData.subscription.plan,
            status: userData.subscription.status,
            commissionRate: userData.commissionRate
          }
        };
        
        setUser(loggedInUser);
        localStorage.setItem('user', JSON.stringify(loggedInUser));
        localStorage.setItem('token', token);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login failed');
    }
  };

  // Called after Fayda SSO callback — token already issued by backend
  const loginWithToken = async (accessToken: string, refreshToken: string) => {
    try {
      localStorage.setItem('token', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);

      // Fetch user profile using the token
      const response = await api.getProfile();
      if (response.success && response.data) {
        const userData = (response.data as any)?.user || response.data;
        const loggedInUser: User = {
          id: userData.id,
          name: userData.name,
          email: userData.email || '',
          phone: userData.phone || '',
          role: userData.role,
          isVerified: userData.is_verified ?? true,
          profile_photo: userData.profile_photo,
          subscription: {
            plan: userData.subscription_plan || 'free',
            status: userData.subscription_status || 'active',
          },
        };
        setUser(loggedInUser);
        localStorage.setItem('user', JSON.stringify(loggedInUser));
      }
    } catch (error: any) {
      console.error('loginWithToken error:', error);
    }
  };

  const register = async (name: string, email: string, phone: string, password: string, plan: string = 'free') => {
    try {
      const response = await api.register({
        name,
        email,
        phone,
        password,
        role: plan === 'seller' || plan === 'premium' ? 'seller' : 'buyer'
      });
      
      if (response.success && response.data) {
        const userId = response.data.userId || response.data.user_id;
        const pending = { id: userId, name, email, phone, plan };
        setPendingUser(pending);
        localStorage.setItem('pendingUser', JSON.stringify(pending));
        
        return { userId };
      }
      
      throw new Error('Registration failed');
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'Registration failed');
    }
  };

  const verifyOTP = async (userId: string, otp: string) => {
    // Mock OTP verification - replace with actual API call
    if (otp.length === 6) {
      console.log('OTP verified successfully');
      return;
    }
    throw new Error('Invalid OTP');
  };

  const activateSubscription = async (userId: string, plan: string, paymentMethod?: string) => {
    // Mock subscription activation - replace with actual API call
    if (!pendingUser) throw new Error('No pending user found');
    
    const newUser: User = {
      id: userId,
      name: pendingUser.name,
      email: pendingUser.email,
      phone: pendingUser.phone,
      role: plan === 'seller' || plan === 'premium' ? 'seller' : 'buyer',
      isVerified: true,
      subscription: {
        plan: plan as 'free' | 'seller' | 'premium',
        status: 'active',
        commissionRate: plan === 'seller' ? 10 : plan === 'premium' ? 3 : undefined
      }
    };
    
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
    localStorage.removeItem('pendingUser');
    setPendingUser(null);
  };

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await api.getProfile();
      if (response.success && response.data) {
        const userData = (response.data as any)?.user || response.data;
        const updated: User = {
          id: userData.id,
          name: userData.name,
          email: userData.email || '',
          phone: userData.phone || '',
          role: userData.role,
          isVerified: userData.is_verified ?? userData.isVerified ?? false,
          profile_photo: userData.profile_photo,
          subscription: {
            plan: userData.subscription_plan || userData.subscription?.plan || 'free',
            status: userData.subscription_status || userData.subscription?.status || 'active',
            commissionRate: userData.commission_rate || userData.subscription?.commissionRate,
          },
        };
        setUser(updated);
        localStorage.setItem('user', JSON.stringify(updated));
      }
    } catch (e) {
      console.error('refreshUser error:', e);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('pendingUser');
    setPendingUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithToken, register, verifyOTP, activateSubscription, logout, refreshUser, isAuthenticated: !!user, pendingUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
