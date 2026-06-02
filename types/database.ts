import { GloProfileDraft } from '@/lib/glo-profile';

// User profile linked to auth.users
export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  face_setup_completed: boolean
  dna_result?: any
  onboarding_data?: any
  created_at: string
  updated_at: string
}

// AI scan results
export interface Scan {
  id: string
  user_id: string
  image_url: string
  overall_score: number
  category_scores: CategoryScores
  suggestions: string[]
  verdict?: 'GO' | 'FIX'
  coaching_compliment?: string
  created_at: string
}

export interface CategoryScores {
  foundation: number
  eyes: number
  lips: number
  contour: number
  brows: number
}

// Streak tracking
export interface Streak {
  id: string
  user_id: string
  current_streak: number
  longest_streak: number
  last_scan_date: string | null
}

// Subscription/Pricing
export interface Subscription {
  id: string
  user_id: string
  plan: 'free' | 'pro'
  status: 'active' | 'cancelled' | 'past_due'
  current_period_end: string
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
        Relationships: []
      }
      scans: {
        Row: Scan
        Insert: Omit<Scan, 'id' | 'created_at'>
        Update: Partial<Omit<Scan, 'id' | 'created_at'>>
        Relationships: []
      }
      streaks: {
        Row: Streak
        Insert: Omit<Streak, 'id'>
        Update: Partial<Omit<Streak, 'id'>>
        Relationships: []
      }
      subscriptions: {
        Row: Subscription
        Insert: Omit<Subscription, 'id'>
        Update: Partial<Omit<Subscription, 'id'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}