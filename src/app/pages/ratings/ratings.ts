import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService, EventWithRelations, Rating } from '../../services/supabase.service';

interface PendingEvent {
  event: EventWithRelations;
  checkedIn: boolean;
}

@Component({
  selector: 'app-ratings',
  imports: [CommonModule, FormsModule],
  templateUrl: './ratings.html',
  styleUrl: './ratings.css'
})
export class Ratings implements OnInit {
  private supabase = inject(SupabaseService);
  protected readonly loading = signal<boolean>(true);
  protected readonly activeTab = signal<'pending' | 'history'>('pending');
  protected readonly showRatingModal = signal<boolean>(false);
  protected readonly selectedEvent = signal<EventWithRelations | null>(null);
  protected readonly ratingScore = signal<number>(0);
  protected readonly ratingReview = signal<string>('');
  protected readonly wasPresent = signal<boolean>(true);

  // User stats
  protected readonly userStats = signal({
    totalRatings: 0,
    totalReviews: 0,
    eventsAttended: 0,
    avgRating: 0
  });

  // Events user has checked into but not rated yet
  protected readonly pendingEvents = signal<PendingEvent[]>([]);

  // User's rating history
  protected readonly ratingHistory = signal<Rating[]>([]);

  async ngOnInit() {
    try {
      await this.loadData();
    } catch (error) {
      console.error('Error loading ratings data:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async loadData() {
    // Load user ratings
    const ratings = await this.supabase.getUserRatings();
    this.ratingHistory.set(ratings);

    // Load pending events (visited but not rated)
    const pending = await this.supabase.getUserPendingRatings();
    const visits = await this.supabase.getUserVisits();
    const visitEventIds = new Set(visits.map(v => v.event_id));
    
    const pendingEvents = pending.map(event => ({
      event,
      checkedIn: visitEventIds.has(event.id)
    }));
    this.pendingEvents.set(pendingEvents);

    // Calculate user stats
    const totalRatings = ratings.length;
    const totalReviews = ratings.filter(r => r.review && r.review.trim() !== '').length;
    const eventsAttended = visits.length;
    const avgRating = totalRatings > 0
      ? ratings.reduce((sum, r) => sum + r.score, 0) / totalRatings
      : 0;

    this.userStats.set({
      totalRatings,
      totalReviews,
      eventsAttended,
      avgRating: parseFloat(avgRating.toFixed(1))
    });
  }

  // Computed values
  protected readonly pendingCount = computed(() => 
    this.pendingEvents().filter(p => p.checkedIn).length
  );

  protected readonly historyCount = computed(() => this.ratingHistory().length);

  setActiveTab(tab: 'pending' | 'history'): void {
    this.activeTab.set(tab);
  }

  async checkIn(eventId: string): Promise<void> {
    try {
      await this.supabase.checkIn(eventId);
      const updated = this.pendingEvents().map(p => 
        p.event.id === eventId ? { ...p, checkedIn: true } : p
      );
      this.pendingEvents.set(updated);
    } catch (error) {
      console.error('Error checking in:', error);
    }
  }

  openRatingModal(event: EventWithRelations): void {
    this.selectedEvent.set(event);
    this.ratingScore.set(0);
    this.ratingReview.set('');
    this.wasPresent.set(true);
    this.showRatingModal.set(true);
  }

  closeRatingModal(): void {
    this.showRatingModal.set(false);
    this.selectedEvent.set(null);
  }

  setRating(score: number): void {
    this.ratingScore.set(score);
  }

  updateReview(event: any): void {
    this.ratingReview.set(event.target.value);
  }

  togglePresent(): void {
    this.wasPresent.set(!this.wasPresent());
  }

  async submitRating(): Promise<void> {
    const event = this.selectedEvent();
    if (!event || this.ratingScore() === 0) return;

    try {
      // Create rating in Supabase
      const newRating = await this.supabase.createRating(
        event.id,
        this.ratingScore(),
        this.ratingReview() || undefined,
        this.wasPresent()
      );

      // Reload data
      await this.loadData();

      this.closeRatingModal();
    } catch (error) {
      console.error('Error submitting rating:', error);
    }
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  formatDateTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStarsArray(count: number): number[] {
    return Array(count).fill(0);
  }

  getEmptyStarsArray(count: number): number[] {
    return Array(5 - count).fill(0);
  }

  getCategoryColor(categoryId: string): string {
    const event = this.selectedEvent();
    if (event?.category) {
      return event.category.color;
    }
    const colors: Record<string, string> = {
      music: '#FF6B5B',
      food: '#FFD93D',
      culture: '#9B7EDE',
      sports: '#6BCAB3',
      art: '#FFB5C5'
    };
    return colors[categoryId] || '#7B68C8';
  }

  getEventCategoryId(event: EventWithRelations): string {
    return event.category_id;
  }

  getEventCityName(event: EventWithRelations): string {
    return event.city?.name || '';
  }

  getEventDate(event: EventWithRelations): string {
    return event.event_date;
  }
}


