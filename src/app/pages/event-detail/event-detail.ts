import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SupabaseService, EventWithRelations, Rating } from '../../services/supabase.service';

@Component({
  selector: 'app-event-detail',
  imports: [CommonModule, FormsModule],
  templateUrl: './event-detail.html',
  styleUrl: './event-detail.css'
})
export class EventDetail implements OnInit {
  private supabase = inject(SupabaseService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Loading states
  protected readonly loading = signal<boolean>(true);
  protected readonly submitting = signal<boolean>(false);
  protected readonly submitted = signal<boolean>(false);

  // Event data
  protected readonly event = signal<EventWithRelations | null>(null);
  protected readonly existingRating = signal<Rating | null>(null);

  // User input
  protected readonly userRating = signal<number>(0);
  protected readonly hoverRating = signal<number>(0);
  protected readonly wasPresent = signal<boolean>(true);
  protected readonly reviewText = signal<string>('');

  // Check-in status
  protected readonly hasCheckedIn = signal<boolean>(false);

  // Computed
  protected readonly displayRating = computed(() => {
    const hover = this.hoverRating();
    const user = this.userRating();
    return hover > 0 ? hover : user;
  });

  protected readonly canSubmit = computed(() => {
    return this.userRating() > 0 && !this.submitting();
  });

  protected readonly isEditing = computed(() => {
    return this.existingRating() !== null;
  });

  async ngOnInit() {
    const eventId = this.route.snapshot.paramMap.get('id');
    if (!eventId) {
      this.router.navigate(['/']);
      return;
    }

    try {
      await this.loadEventData(eventId);
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async loadEventData(eventId: string) {
    // Load event
    const eventData = await this.supabase.getEventById(eventId);
    if (!eventData) {
      this.router.navigate(['/']);
      return;
    }
    this.event.set(eventData);

    // Track view
    await this.supabase.trackEventView(eventId);

    // Check if user has checked in
    const checkedIn = await this.supabase.hasUserCheckedIn(eventId);
    this.hasCheckedIn.set(checkedIn);

    // Load existing rating if any
    const user = this.supabase.getCurrentUser();
    if (user) {
      const ratings = await this.supabase.getEventRatings(eventId);
      const userRating = ratings.find(r => r.user_id === user.id);
      if (userRating) {
        this.existingRating.set(userRating);
        this.userRating.set(userRating.score);
        this.wasPresent.set(userRating.was_present);
        this.reviewText.set(userRating.review || '');
      }
    }
  }

  goBack() {
    this.router.navigate(['/explore']);
  }

  setRating(rating: number) {
    this.userRating.set(rating);
  }

  setHoverRating(rating: number) {
    this.hoverRating.set(rating);
  }

  clearHoverRating() {
    this.hoverRating.set(0);
  }

  togglePresence() {
    this.wasPresent.set(!this.wasPresent());
  }

  async checkIn() {
    const eventData = this.event();
    if (!eventData) return;

    try {
      await this.supabase.checkIn(eventData.id);
      this.hasCheckedIn.set(true);
      this.wasPresent.set(true);
    } catch (error) {
      console.error('Check-in failed:', error);
    }
  }

  async submitRating() {
    const eventData = this.event();
    if (!eventData || !this.canSubmit()) return;

    this.submitting.set(true);

    try {
      await this.supabase.createRating(
        eventData.id,
        this.userRating(),
        this.reviewText() || undefined,
        this.wasPresent()
      );

      this.submitted.set(true);

      // Reload event to get updated stats
      const updatedEvent = await this.supabase.getEventById(eventData.id);
      if (updatedEvent) {
        this.event.set(updatedEvent);
      }

      // Show success for a moment then reset
      setTimeout(() => {
        this.submitted.set(false);
      }, 3000);
    } catch (error) {
      console.error('Rating submission failed:', error);
    } finally {
      this.submitting.set(false);
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  formatTime(timeString: string): string {
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  }

  getCategoryIcon(categoryId: string): string {
    const icons: Record<string, string> = {
      'cat-music': '🎵',
      'cat-food': '🍽️',
      'cat-culture': '🎭',
      'cat-sports': '⚽',
      'cat-art': '🎨',
      'cat-tech': '💻'
    };
    return icons[categoryId] || '📅';
  }
}

