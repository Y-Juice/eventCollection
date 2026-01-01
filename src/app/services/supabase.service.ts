import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

// Database Types
export interface City {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  created_at?: string;
}

export interface Event {
  id: string;
  title: string;
  subtitle: string | null;
  category_id: string;
  city_id: string;
  neighborhood: string | null;
  event_date: string;
  event_time: string;
  color: string;
  created_at?: string;
  updated_at?: string;
  // Computed fields (from functions)
  avg_rating?: number;
  review_count?: number;
  visitor_count?: number;
  view_count?: number;
}

export interface EventWithRelations extends Event {
  category?: Category;
  city?: City;
}

export interface Rating {
  id: string;
  event_id: string;
  user_id: string;
  score: number;
  review: string | null;
  was_present: boolean;
  created_at: string;
  updated_at: string;
  event?: EventWithRelations;
}

export interface Visit {
  id: string;
  event_id: string;
  user_id: string;
  checked_in_at: string;
}

export interface EventView {
  id: string;
  event_id: string;
  user_id: string;
  viewed_at: string;
}

export interface UserProfile {
  id: string;
  email: string | null;
  name: string | null;
  avatar: string | null;
  city: string | null;
  bio: string | null;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private currentUser = signal<any>(null);

  constructor() {
    const supabaseUrl = environment.supabaseUrl || '';
    const supabaseKey = environment.supabaseKey || '';
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase credentials not configured. Please set SUPABASE_URL and SUPABASE_KEY in environment.');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.initializeAuth();
  }

  private async initializeAuth() {
    const { data: { user } } = await this.supabase.auth.getUser();
    this.currentUser.set(user);
    
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.currentUser.set(session?.user ?? null);
    });
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  getCurrentUser() {
    return this.currentUser();
  }

  // ============================================
  // Auth Methods
  // ============================================

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  }

  async signUp(email: string, password: string, name?: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name
        }
      }
    });
    if (error) throw error;
    
    // Create user profile
    if (data.user) {
      await this.createUserProfile(data.user.id, email, name);
    }
    
    return data;
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  // ============================================
  // Cities
  // ============================================

  async getCities(): Promise<City[]> {
    const { data, error } = await this.supabase
      .from('cities')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  }

  // ============================================
  // Categories
  // ============================================

  async getCategories(): Promise<Category[]> {
    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  }

  // ============================================
  // Events
  // ============================================

  async getEvents(filters?: {
    cityId?: string;
    categoryId?: string;
    limit?: number;
  }): Promise<EventWithRelations[]> {
    let query = this.supabase
      .from('events')
      .select(`
        *,
        category:categories(*),
        city:cities(*)
      `)
      .order('event_date', { ascending: true });

    if (filters?.cityId) {
      query = query.eq('city_id', filters.cityId);
    }

    if (filters?.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Get computed values for each event
    const eventsWithStats = await Promise.all(
      (data || []).map(async (event) => {
        const [avgRating, reviewCount, visitorCount, viewCount] = await Promise.all([
          this.getEventAvgRating(event.id),
          this.getEventReviewCount(event.id),
          this.getEventVisitorCount(event.id),
          this.getEventViewCount(event.id)
        ]);

        return {
          ...event,
          avg_rating: avgRating,
          review_count: reviewCount,
          visitor_count: visitorCount,
          view_count: viewCount
        };
      })
    );

    return eventsWithStats;
  }

  async getEventById(id: string): Promise<EventWithRelations | null> {
    const { data, error } = await this.supabase
      .from('events')
      .select(`
        *,
        category:categories(*),
        city:cities(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return null;

    const [avgRating, reviewCount, visitorCount, viewCount] = await Promise.all([
      this.getEventAvgRating(id),
      this.getEventReviewCount(id),
      this.getEventVisitorCount(id),
      this.getEventViewCount(id)
    ]);

    return {
      ...data,
      avg_rating: avgRating,
      review_count: reviewCount,
      visitor_count: visitorCount,
      view_count: viewCount
    };
  }

  async getEventAvgRating(eventId: string): Promise<number> {
    const { data, error } = await this.supabase
      .rpc('get_event_avg_rating', { event_uuid: eventId });
    
    if (error) throw error;
    return parseFloat(data || '0');
  }

  async getEventReviewCount(eventId: string): Promise<number> {
    const { data, error } = await this.supabase
      .rpc('get_event_review_count', { event_uuid: eventId });
    
    if (error) throw error;
    return data || 0;
  }

  async getEventVisitorCount(eventId: string): Promise<number> {
    const { data, error } = await this.supabase
      .rpc('get_event_visitor_count', { event_uuid: eventId });
    
    if (error) throw error;
    return data || 0;
  }

  async getEventViewCount(eventId: string): Promise<number> {
    const { data, error } = await this.supabase
      .rpc('get_event_view_count', { event_uuid: eventId });
    
    if (error) throw error;
    return data || 0;
  }

  // ============================================
  // Event Views (tracking)
  // ============================================

  async trackEventView(eventId: string): Promise<void> {
    const user = this.getCurrentUser();
    if (!user) return;

    const { error } = await this.supabase
      .from('event_views')
      .upsert({
        event_id: eventId,
        user_id: user.id
      }, {
        onConflict: 'event_id,user_id'
      });

    if (error) throw error;
  }

  // ============================================
  // Visits/Check-ins
  // ============================================

  async checkIn(eventId: string): Promise<Visit> {
    const user = this.getCurrentUser();
    if (!user) throw new Error('User must be authenticated');

    const { data, error } = await this.supabase
      .from('visits')
      .upsert({
        event_id: eventId,
        user_id: user.id
      }, {
        onConflict: 'event_id,user_id'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getUserVisits(userId?: string): Promise<Visit[]> {
    const user = userId || this.getCurrentUser()?.id;
    if (!user) return [];

    const { data, error } = await this.supabase
      .from('visits')
      .select('*')
      .eq('user_id', user)
      .order('checked_in_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async hasUserCheckedIn(eventId: string, userId?: string): Promise<boolean> {
    const user = userId || this.getCurrentUser()?.id;
    if (!user) return false;

    const { data, error } = await this.supabase
      .from('visits')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', user)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  }

  // ============================================
  // Ratings
  // ============================================

  async createRating(
    eventId: string,
    score: number,
    review?: string,
    wasPresent: boolean = true
  ): Promise<Rating> {
    const user = this.getCurrentUser();
    if (!user) throw new Error('User must be authenticated');

    const { data, error } = await this.supabase
      .from('ratings')
      .upsert({
        event_id: eventId,
        user_id: user.id,
        score,
        review: review || null,
        was_present: wasPresent
      }, {
        onConflict: 'event_id,user_id'
      })
      .select(`
        *,
        event:events(
          *,
          category:categories(*),
          city:cities(*)
        )
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async getUserRatings(userId?: string): Promise<Rating[]> {
    const user = userId || this.getCurrentUser()?.id;
    if (!user) return [];

    const { data, error } = await this.supabase
      .from('ratings')
      .select(`
        *,
        event:events(
          *,
          category:categories(*),
          city:cities(*)
        )
      `)
      .eq('user_id', user)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getEventRatings(eventId: string): Promise<Rating[]> {
    const { data, error } = await this.supabase
      .from('ratings')
      .select(`
        *,
        event:events(
          *,
          category:categories(*),
          city:cities(*)
        )
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getUserPendingRatings(userId?: string): Promise<EventWithRelations[]> {
    const user = userId || this.getCurrentUser()?.id;
    if (!user) return [];

    // Get events user has checked into but not rated
    const { data, error } = await this.supabase
      .from('visits')
      .select(`
        event:events(
          *,
          category:categories(*),
          city:cities(*)
        )
      `)
      .eq('user_id', user)
      .not('event_id', 'in', 
        this.supabase
          .from('ratings')
          .select('event_id')
          .eq('user_id', user)
      );

    if (error) throw error;
    return (data || []).map((v: any) => v.event).filter(Boolean);
  }

  async deleteRating(ratingId: string): Promise<void> {
    const { error } = await this.supabase
      .from('ratings')
      .delete()
      .eq('id', ratingId);

    if (error) throw error;
  }

  // ============================================
  // User Profiles
  // ============================================

  async getUserProfile(userId?: string): Promise<UserProfile | null> {
    const user = userId || this.getCurrentUser()?.id;
    if (!user) return null;

    const { data, error } = await this.supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async createUserProfile(userId: string, email: string, name?: string): Promise<UserProfile> {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .insert({
        id: userId,
        email,
        name: name || null,
        avatar: name ? name.substring(0, 2).toUpperCase() : null
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const user = this.getCurrentUser();
    if (!user) throw new Error('User must be authenticated');

    const { data, error } = await this.supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}




