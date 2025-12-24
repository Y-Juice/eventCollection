import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Event {
  id: number;
  title: string;
  subtitle: string;
  category: 'music' | 'food' | 'culture' | 'sports' | 'art';
  city: string;
  neighborhood: string;
  date: string;
  color: string;
}

interface UserRating {
  id: number;
  eventId: number;
  event: Event;
  score: number;
  review: string;
  createdAt: string;
  wasPresent: boolean;
}

interface PendingEvent {
  event: Event;
  checkedIn: boolean;
}

@Component({
  selector: 'app-ratings',
  imports: [CommonModule, FormsModule],
  templateUrl: './ratings.html',
  styleUrl: './ratings.css'
})
export class Ratings {
  protected readonly activeTab = signal<'pending' | 'history'>('pending');
  protected readonly showRatingModal = signal<boolean>(false);
  protected readonly selectedEvent = signal<Event | null>(null);
  protected readonly ratingScore = signal<number>(0);
  protected readonly ratingReview = signal<string>('');
  protected readonly wasPresent = signal<boolean>(true);

  // User stats
  protected readonly userStats = signal({
    totalRatings: 12,
    totalReviews: 8,
    eventsAttended: 15,
    avgRating: 4.3
  });

  // Events user has checked into but not rated yet
  protected readonly pendingEvents = signal<PendingEvent[]>([
    {
      event: {
        id: 1,
        title: 'Jazz Nights',
        subtitle: 'Live at Flagey',
        category: 'music',
        city: 'Brussels',
        neighborhood: 'Ixelles',
        date: '2024-12-28',
        color: '#FF6B5B'
      },
      checkedIn: true
    },
    {
      event: {
        id: 11,
        title: 'Light Festival',
        subtitle: 'City Center',
        category: 'culture',
        city: 'Ghent',
        neighborhood: 'Korenmarkt',
        date: '2024-12-23',
        color: '#9B7EDE'
      },
      checkedIn: true
    },
    {
      event: {
        id: 2,
        title: 'Winter Market',
        subtitle: 'Grand Place',
        category: 'food',
        city: 'Brussels',
        neighborhood: 'City Center',
        date: '2024-12-20',
        color: '#FFD93D'
      },
      checkedIn: false
    },
    {
      event: {
        id: 15,
        title: 'Chocolate Tour',
        subtitle: 'Master Class',
        category: 'food',
        city: 'Bruges',
        neighborhood: 'Markt',
        date: '2024-12-22',
        color: '#FFD93D'
      },
      checkedIn: false
    }
  ]);

  // User's rating history
  protected readonly ratingHistory = signal<UserRating[]>([
    {
      id: 1,
      eventId: 3,
      event: {
        id: 3,
        title: 'Magritte Expo',
        subtitle: 'Royal Museums',
        category: 'art',
        city: 'Brussels',
        neighborhood: 'Sablon',
        date: '2024-12-15',
        color: '#FFB5C5'
      },
      score: 5,
      review: 'Absolutely stunning exhibition! The surrealist masterpieces were breathtaking. A must-see for any art lover.',
      createdAt: '2024-12-15T18:30:00',
      wasPresent: true
    },
    {
      id: 2,
      eventId: 8,
      event: {
        id: 8,
        title: 'Street Food Fest',
        subtitle: 'Park Spoor Noord',
        category: 'food',
        city: 'Antwerp',
        neighborhood: 'Dam',
        date: '2024-12-21',
        color: '#FFD93D'
      },
      score: 4,
      review: 'Great variety of food trucks. The atmosphere was amazing but it got quite crowded.',
      createdAt: '2024-12-21T20:15:00',
      wasPresent: true
    },
    {
      id: 3,
      eventId: 4,
      event: {
        id: 4,
        title: 'Theatre Night',
        subtitle: 'La Monnaie',
        category: 'culture',
        city: 'Brussels',
        neighborhood: 'City Center',
        date: '2024-12-22',
        color: '#9B7EDE'
      },
      score: 5,
      review: 'Outstanding performance! The acoustics were perfect and the cast was phenomenal.',
      createdAt: '2024-12-22T23:00:00',
      wasPresent: true
    },
    {
      id: 4,
      eventId: 12,
      event: {
        id: 12,
        title: 'Veggie World',
        subtitle: 'Plant-based Festival',
        category: 'food',
        city: 'Ghent',
        neighborhood: 'Sint-Pieters',
        date: '2024-12-19',
        color: '#FFD93D'
      },
      score: 4,
      review: 'Delicious plant-based options. Learned a lot from the cooking demos!',
      createdAt: '2024-12-19T16:45:00',
      wasPresent: true
    },
    {
      id: 5,
      eventId: 6,
      event: {
        id: 6,
        title: 'Techno Warehouse',
        subtitle: 'Fuse Club',
        category: 'music',
        city: 'Brussels',
        neighborhood: 'Marolles',
        date: '2024-12-31',
        color: '#FF6B5B'
      },
      score: 5,
      review: '',
      createdAt: '2024-12-31T04:30:00',
      wasPresent: true
    }
  ]);

  // Computed values
  protected readonly pendingCount = computed(() => 
    this.pendingEvents().filter(p => p.checkedIn).length
  );

  protected readonly historyCount = computed(() => this.ratingHistory().length);

  setActiveTab(tab: 'pending' | 'history'): void {
    this.activeTab.set(tab);
  }

  checkIn(eventId: number): void {
    const updated = this.pendingEvents().map(p => 
      p.event.id === eventId ? { ...p, checkedIn: true } : p
    );
    this.pendingEvents.set(updated);
  }

  openRatingModal(event: Event): void {
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

  submitRating(): void {
    const event = this.selectedEvent();
    if (!event || this.ratingScore() === 0) return;

    // Create new rating
    const newRating: UserRating = {
      id: Date.now(),
      eventId: event.id,
      event: event,
      score: this.ratingScore(),
      review: this.ratingReview(),
      createdAt: new Date().toISOString(),
      wasPresent: this.wasPresent()
    };

    // Add to history
    this.ratingHistory.set([newRating, ...this.ratingHistory()]);

    // Remove from pending
    this.pendingEvents.set(
      this.pendingEvents().filter(p => p.event.id !== event.id)
    );

    // Update stats
    const stats = this.userStats();
    this.userStats.set({
      ...stats,
      totalRatings: stats.totalRatings + 1,
      totalReviews: this.ratingReview() ? stats.totalReviews + 1 : stats.totalReviews,
      eventsAttended: this.wasPresent() ? stats.eventsAttended + 1 : stats.eventsAttended
    });

    this.closeRatingModal();
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

  getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      music: '#FF6B5B',
      food: '#FFD93D',
      culture: '#9B7EDE',
      sports: '#6BCAB3',
      art: '#FFB5C5'
    };
    return colors[category] || '#7B68C8';
  }
}

