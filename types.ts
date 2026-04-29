
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

export enum UserType {
  Brands = 'For Brands',
  Clubs = 'For Student & Professional Orgs',
  Ambassadors = 'For Student & Professional Influencers',
}

export interface Opportunity {
  id: string;
  title: string;
  amount: string;
  type: 'Campaign' | 'Sponsorship' | 'Role' | 'Ambassador';
  category: string;
  company?: string;
}

export enum UserRole {
  Brand = 'Brand',
  StudentOrg = 'Student/Professional Organization',
  Ambassador = 'Student/Professional Influencer',
  Admin = 'Admin',
}

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

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  imageUrl?: string;
  bio?: string;
  location?: string;
  phoneNumber?: string;
  website?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  industry?: string;
  university?: string;
  handle?: string;
  clubType?: string;
  companySize?: string;
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
