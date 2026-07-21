
import React from 'react';

export interface NavLink {
  label: string;
  href: string;
}

export interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  bullets: string[];
  useCase: string;
  image: string;
}

export const UserType = {
  Brands: 'For Brands',
  Associations: 'For Associations',
  Creators: 'For Creators',
} as const;

export type UserType = typeof UserType[keyof typeof UserType];

export interface Opportunity {
  id: string;
  title: string;
  amount: string;
  type: 'Campaign' | 'Sponsorship' | 'Role' | 'Creator';
  category: string;
  company?: string;
}

export const UserRole = {
  Brand: 'Brand',
  Association: 'Organization',
  Creator: 'Creator',
  Admin: 'Admin',
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export interface HowItWorksStep {
  title: string;
  description: string;
}

export interface HowItWorksContent {
  [key: string]: HowItWorksStep[];
}

export interface Testimonial {
  quote: string;
  name: string;
  title: string;
  image: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  fileType: 'image' | 'video' | 'document' | 'link';
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  imageUrl?: string;
  bio?: string;
  location?: string;
  phoneNumber?: string;
  accountName?: string;
  accountNumber?: string;
  bankCode?: string;
  bankName?: string;
  website?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  tiktok?: string;
  industry?: string;
  university?: string;
  handle?: string;
  clubType?: string;
  companySize?: string;
  coverPhotoUrl?: string;
  influencerType?: string;
  portfolio?: PortfolioItem[];
  createdAt: string;
}

export interface DashboardMetric {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
}

export interface Proposal {
  id: string;
  senderId: string;
  sender: {
    name: string;
    role: string;
    imageUrl?: string;
    email: string;
  };
  recipientId: string;
  recipient: {
    name: string;
    role: string;
    imageUrl?: string;
    email: string;
  };
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}
