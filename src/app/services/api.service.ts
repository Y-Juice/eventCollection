import { Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';

// Types
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
export class ApiService {
  private apiUrl = environment.apiUrl || 'http://localhost:3000/api';
  private currentUser = signal<UserProfile | null>(null);
  private userId: string;

  constructor() {
    // Generate or retrieve anonymous user ID
    this.userId = this.getOrCreateUserId();
  }

  private getOrCreateUserId(): string {
    let userId = localStorage.getItem('anonymous_user_id');
    if (!userId) {
      userId = 'anon-' + Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
      localStorage.setItem('anonymous_user_id', userId);
    }
    return userId;
  }

  getCurrentUserId(): string {
    return this.userId;
  }

  getCurrentUser(): UserProfile | null {
    return this.currentUser();
  }

  // ============================================
  // Data Validation Helpers
  // ============================================

  private sanitizeString(str: string | null | undefined): string {
    if (!str) return '';
    return str.trim().replace(/<[^>]*>/g, '');
  }

  private validateScore(score: number): number {
    const validScore = Math.round(score);
    return Math.max(1, Math.min(5, validScore));
  }

  // ============================================
  // HTTP Helpers
  // ============================================

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.apiUrl}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const response = await fetch(url, { ...defaultOptions, ...options });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // ============================================
  // Cities
  // ============================================

  async getCities(): Promise<City[]> {
    return this.request<City[]>('/cities');
  }

  // ============================================
  // Categories
  // ============================================

  async getCategories(): Promise<Category[]> {
    return this.request<Category[]>('/categories');
  }

  // ============================================
  // Events
  // ============================================

  async getEvents(filters?: {
    cityId?: string;
    categoryId?: string;
    limit?: number;
  }): Promise<EventWithRelations[]> {
    const params = new URLSearchParams();
    
    if (filters?.cityId) {
      params.append('cityId', filters.cityId);
    }
    if (filters?.categoryId) {
      params.append('categoryId', filters.categoryId);
    }
    if (filters?.limit) {
      params.append('limit', filters.limit.toString());
    }

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<EventWithRelations[]>(`/events${query}`);
  }

  async getEventById(id: string): Promise<EventWithRelations | null> {
    try {
      return await this.request<EventWithRelations>(`/events/${id}`);
    } catch {
      return null;
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    await this.request(`/events/${eventId}`, { method: 'DELETE' });
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
    // Validate and sanitize input data
    const validatedScore = this.validateScore(score);
    const sanitizedReview = this.sanitizeString(review);

    return this.request<Rating>('/ratings', {
      method: 'POST',
      body: JSON.stringify({
        event_id: eventId,
        user_id: this.userId,
        score: validatedScore,
        review: sanitizedReview || null,
        was_present: wasPresent
      })
    });
  }

  async getUserRatings(userId?: string): Promise<Rating[]> {
    const user = userId || this.userId;
    const allRatings = await this.request<Rating[]>('/ratings');
    return allRatings.filter(r => r.user_id === user);
  }

  async getEventRatings(eventId: string): Promise<Rating[]> {
    return this.request<Rating[]>(`/ratings/event/${eventId}`);
  }

  async getAllRatings(): Promise<Rating[]> {
    return this.request<Rating[]>('/ratings');
  }

  async deleteRating(ratingId: string): Promise<void> {
    await this.request(`/ratings/${ratingId}`, { method: 'DELETE' });
  }

  // ============================================
  // Visits (Check-ins)
  // ============================================

  async checkIn(eventId: string): Promise<Visit> {
    return this.request<Visit>('/visits', {
      method: 'POST',
      body: JSON.stringify({
        event_id: eventId,
        user_id: this.userId
      })
    });
  }

  async hasUserCheckedIn(eventId: string, userId?: string): Promise<boolean> {
    const user = userId || this.userId;
    const result = await this.request<{ hasCheckedIn: boolean }>(`/visits/check/${eventId}/${user}`);
    return result.hasCheckedIn;
  }

  // ============================================
  // Event Views
  // ============================================

  async trackEventView(eventId: string): Promise<void> {
    await this.request('/views', {
      method: 'POST',
      body: JSON.stringify({
        event_id: eventId,
        user_id: this.userId
      })
    });
  }

  // ============================================
  // User Tracking
  // ============================================

  async saveUserEvents(events: any[]): Promise<void> {
    if (events.length === 0) return;

    // Validate and sanitize events before sending
    const validatedEvents = events.map(event => ({
      ...event,
      user_id: this.userId,
      element_text: this.sanitizeString(event.element_text)?.substring(0, 500)
    }));

    await this.request('/user-events/batch', {
      method: 'POST',
      body: JSON.stringify({ events: validatedEvents })
    });
  }

  async trackUserEvent(eventData: any): Promise<void> {
    // Validate and sanitize the event data
    const sanitizedData = {
      user_id: this.userId,
      session_id: eventData.session_id,
      event_type: this.sanitizeString(eventData.event_type),
      event_category: this.sanitizeString(eventData.event_category),
      element_type: this.sanitizeString(eventData.element_type),
      element_id: this.sanitizeString(eventData.element_id),
      element_class: this.sanitizeString(eventData.element_class),
      element_text: this.sanitizeString(eventData.element_text)?.substring(0, 500),
      page_url: this.sanitizeString(eventData.page_url),
      page_title: this.sanitizeString(eventData.page_title),
      route_path: this.sanitizeString(eventData.route_path),
      x_coordinate: eventData.x_coordinate,
      y_coordinate: eventData.y_coordinate,
      viewport_width: eventData.viewport_width,
      viewport_height: eventData.viewport_height,
      scroll_position: eventData.scroll_position,
      metadata: eventData.metadata,
      duration_ms: eventData.duration_ms,
      file_metadata: eventData.file_metadata
    };

    await this.request('/user-events', {
      method: 'POST',
      body: JSON.stringify(sanitizedData)
    });
  }

  // ============================================
  // User Profiles
  // ============================================

  async getUsers(): Promise<UserProfile[]> {
    return this.request<UserProfile[]>('/users');
  }

  async getUserProfile(userId?: string): Promise<UserProfile | null> {
    const user = userId || this.userId;
    try {
      return await this.request<UserProfile>(`/users/${user}`);
    } catch {
      return null;
    }
  }

  async createOrUpdateUserProfile(name?: string, email?: string): Promise<UserProfile> {
    const sanitizedName = this.sanitizeString(name);
    
    return this.request<UserProfile>('/users', {
      method: 'POST',
      body: JSON.stringify({
        id: this.userId,
        name: sanitizedName || null,
        email: email || null
      })
    });
  }

  // ============================================
  // Health Check
  // ============================================

  async checkHealth(): Promise<{ status: string; database: string }> {
    return this.request<{ status: string; database: string }>('/health'.replace('/api', ''));
  }
}


