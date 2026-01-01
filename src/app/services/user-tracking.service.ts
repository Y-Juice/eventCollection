import { Injectable, inject, signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { SupabaseService } from './supabase.service';
import { filter } from 'rxjs/operators';

export interface UserEvent {
  id?: string;
  user_id: string;
  event_type: string;
  event_category: string;
  element_type?: string;
  element_id?: string;
  element_class?: string;
  element_text?: string;
  page_url: string;
  page_title?: string;
  route_path?: string;
  x_coordinate?: number;
  y_coordinate?: number;
  viewport_width?: number;
  viewport_height?: number;
  scroll_position?: number;
  timestamp: string;
  session_id: string;
  metadata?: Record<string, any>;
  duration_ms?: number;
  file_metadata?: FileMetadata;
}

export interface FileMetadata {
  file_name: string;
  file_type: string;
  file_size: number;
  last_modified?: number;
  mime_type?: string;
  dimensions?: {
    width?: number;
    height?: number;
  };
  duration?: number;
  bitrate?: number;
  codec?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserTrackingService {
  private supabase = inject(SupabaseService);
  private router = inject(Router);
  private sessionId = this.generateSessionId();
  private userId = signal<string | null>(null);
  private eventQueue: UserEvent[] = [];
  private batchSize = 50;
  private flushInterval = 5000; // 5 seconds
  private flushTimer: any = null;
  private isInitialized = false;

  constructor() {
    this.initializeTracking();
  }

  private async initializeTracking() {
    // Get or create user ID
    await this.ensureUserId();
    
    // Listen to auth state changes
    this.setupAuthListener();
    
    // Track navigation
    this.trackNavigation();
    
    // Start batch flushing
    this.startBatchFlush();
    
    // Track page visibility changes
    this.trackVisibilityChanges();
    
    // Track window unload
    this.trackUnload();
    
    this.isInitialized = true;
  }

  private setupAuthListener() {
    // Listen to auth state changes from Supabase
    this.supabase.client.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const oldUserId = this.userId();
        const newUserId = session.user.id;
        
        // Update user ID
        this.userId.set(newUserId);
        
        // Track authentication event
        await this.trackEvent({
          event_type: 'user_authenticated',
          event_category: 'authentication',
          metadata: {
            previous_user_id: oldUserId,
            new_user_id: newUserId,
            migration_occurred: oldUserId && oldUserId.startsWith('anon_')
          }
        });

        // If user was anonymous, migrate their events
        if (oldUserId && oldUserId.startsWith('anon_')) {
          await this.migrateAnonymousEvents(oldUserId, newUserId);
        }
      } else if (event === 'SIGNED_OUT') {
        // Generate new anonymous UID
        const newAnonUid = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('anonymous_user_id', newAnonUid);
        this.userId.set(newAnonUid);
        
        // Track sign out
        await this.trackEvent({
          event_type: 'user_signed_out',
          event_category: 'authentication'
        });
      }
    });
  }

  private async migrateAnonymousEvents(oldUserId: string, newUserId: string): Promise<void> {
    try {
      // Update all events in the queue with new user ID
      this.eventQueue.forEach(event => {
        if (event.user_id === oldUserId) {
          event.user_id = newUserId;
        }
      });

      // Also update events in database (if any were already saved)
      // This would require a database migration function
      // For now, we'll just update the queue
      
      await this.trackEvent({
        event_type: 'events_migrated',
        event_category: 'system',
        metadata: {
          from_user_id: oldUserId,
          to_user_id: newUserId,
          events_migrated: this.eventQueue.length
        }
      });
    } catch (error) {
      console.warn('Error migrating anonymous events:', error);
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async ensureUserId(): Promise<string> {
    let uid = this.userId();
    
    if (!uid) {
      // Try to get authenticated user first
      const authUser = this.supabase.getCurrentUser();
      if (authUser?.id) {
        uid = authUser.id;
      } else {
        // Generate or retrieve anonymous UID from localStorage
        const storedUid = localStorage.getItem('anonymous_user_id');
        if (storedUid) {
          uid = storedUid;
        } else {
          uid = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem('anonymous_user_id', uid);
        }
      }
      this.userId.set(uid);
    }
    
    return uid || '';
  }

  private trackNavigation() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.trackEvent({
          event_type: 'navigation',
          event_category: 'navigation',
          route_path: event.urlAfterRedirects || event.url,
          page_url: window.location.href,
          page_title: document.title
        });
      });
  }

  private trackVisibilityChanges() {
    document.addEventListener('visibilitychange', () => {
      this.trackEvent({
        event_type: 'visibility_change',
        event_category: 'system',
        metadata: {
          hidden: document.hidden,
          visibility_state: document.visibilityState
        }
      });
    });
  }

  private trackUnload() {
    window.addEventListener('beforeunload', () => {
      // Flush all pending events before page unload
      this.flushEvents(true);
    });
  }

  private startBatchFlush() {
    this.flushTimer = setInterval(() => {
      this.flushEvents();
    }, this.flushInterval);
  }

  async trackEvent(eventData: Partial<UserEvent>): Promise<void> {
    const userId = await this.ensureUserId();
    
    const fullEvent: UserEvent = {
      user_id: userId,
      event_type: eventData.event_type || 'unknown',
      event_category: eventData.event_category || 'interaction',
      element_type: eventData.element_type,
      element_id: eventData.element_id,
      element_class: eventData.element_class,
      element_text: eventData.element_text,
      page_url: eventData.page_url || window.location.href,
      page_title: eventData.page_title || document.title,
      route_path: eventData.route_path || this.router.url,
      x_coordinate: eventData.x_coordinate,
      y_coordinate: eventData.y_coordinate,
      viewport_width: eventData.viewport_width || window.innerWidth,
      viewport_height: eventData.viewport_height || window.innerHeight,
      scroll_position: eventData.scroll_position || window.scrollY,
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
      metadata: eventData.metadata || {},
      duration_ms: eventData.duration_ms,
      file_metadata: eventData.file_metadata
    };

    this.eventQueue.push(fullEvent);

    // Flush if queue is full
    if (this.eventQueue.length >= this.batchSize) {
      await this.flushEvents();
    }
  }

  async trackClick(element: HTMLElement, event: MouseEvent): Promise<void> {
    await this.trackEvent({
      event_type: 'click',
      event_category: 'interaction',
      element_type: element.tagName.toLowerCase(),
      element_id: element.id || undefined,
      element_class: element.className || undefined,
      element_text: this.getElementText(element),
      x_coordinate: event.clientX,
      y_coordinate: event.clientY
    });
  }

  async trackHover(element: HTMLElement, event: MouseEvent, duration?: number): Promise<void> {
    await this.trackEvent({
      event_type: 'hover',
      event_category: 'interaction',
      element_type: element.tagName.toLowerCase(),
      element_id: element.id || undefined,
      element_class: element.className || undefined,
      element_text: this.getElementText(element),
      x_coordinate: event.clientX,
      y_coordinate: event.clientY,
      duration_ms: duration
    });
  }

  async trackScroll(): Promise<void> {
    await this.trackEvent({
      event_type: 'scroll',
      event_category: 'interaction',
      scroll_position: window.scrollY
    });
  }

  async trackFileUpload(file: File, additionalMetadata?: Record<string, any>): Promise<void> {
    const fileMetadata: FileMetadata = {
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      last_modified: file.lastModified,
      mime_type: file.type
    };

    // Extract additional metadata based on file type
    await this.extractFileMetadata(file, fileMetadata);

    await this.trackEvent({
      event_type: 'file_upload',
      event_category: 'file',
      element_type: 'input',
      element_id: 'file_input',
      file_metadata: fileMetadata,
      metadata: additionalMetadata
    });
  }

  private async extractFileMetadata(file: File, metadata: FileMetadata): Promise<void> {
    // Image metadata
    if (file.type.startsWith('image/')) {
      try {
        const img = new Image();
        const url = URL.createObjectURL(file);
        await new Promise((resolve, reject) => {
          img.onload = () => {
            metadata.dimensions = {
              width: img.width,
              height: img.height
            };
            URL.revokeObjectURL(url);
            resolve(null);
          };
          img.onerror = reject;
          img.src = url;
        });
      } catch (error) {
        console.warn('Could not extract image dimensions:', error);
      }
    }

    // Video metadata
    if (file.type.startsWith('video/')) {
      try {
        const video = document.createElement('video');
        const url = URL.createObjectURL(file);
        await new Promise((resolve, reject) => {
          video.onloadedmetadata = () => {
            metadata.dimensions = {
              width: video.videoWidth,
              height: video.videoHeight
            };
            metadata.duration = video.duration;
            URL.revokeObjectURL(url);
            resolve(null);
          };
          video.onerror = reject;
          video.src = url;
        });
      } catch (error) {
        console.warn('Could not extract video metadata:', error);
      }
    }

    // Audio metadata
    if (file.type.startsWith('audio/')) {
      try {
        const audio = document.createElement('audio');
        const url = URL.createObjectURL(file);
        await new Promise((resolve, reject) => {
          audio.onloadedmetadata = () => {
            metadata.duration = audio.duration;
            URL.revokeObjectURL(url);
            resolve(null);
          };
          audio.onerror = reject;
          audio.src = url;
        });
      } catch (error) {
        console.warn('Could not extract audio metadata:', error);
      }
    }
  }

  private getElementText(element: HTMLElement): string {
    // Get text content, but limit length
    const text = element.textContent || element.innerText || '';
    return text.substring(0, 200).trim();
  }

  private async flushEvents(force: boolean = false): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const eventsToFlush = force ? [...this.eventQueue] : this.eventQueue.splice(0, this.batchSize);

    try {
      await this.supabase.saveUserEvents(eventsToFlush);
    } catch (error) {
      console.error('Error flushing events:', error);
      // Re-queue events if flush failed (unless forced)
      if (!force) {
        this.eventQueue.unshift(...eventsToFlush);
      }
    }
  }

  getUserId(): string | null {
    return this.userId();
  }

  getSessionId(): string {
    return this.sessionId;
  }

  // Update user ID (called after login/signup)
  async updateUserId(): Promise<void> {
    const authUser = this.supabase.getCurrentUser();
    if (authUser?.id) {
      const oldUserId = this.userId();
      const newUserId = authUser.id;
      
      if (oldUserId !== newUserId) {
        // If user was anonymous, migrate events
        if (oldUserId && oldUserId.startsWith('anon_')) {
          await this.migrateAnonymousEvents(oldUserId, newUserId);
        }
        
        this.userId.set(newUserId);
      }
    } else {
      // Fall back to anonymous if no auth user
      await this.ensureUserId();
    }
  }

  // Manual flush for testing or critical events
  async flush(): Promise<void> {
    await this.flushEvents(true);
  }
}

