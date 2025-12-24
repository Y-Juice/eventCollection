import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  city: string;
  memberSince: string;
  bio: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  total?: number;
}

interface FavoriteCategory {
  id: string;
  name: string;
  color: string;
  count: number;
}

@Component({
  selector: 'app-profile',
  imports: [CommonModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile {
  protected readonly user = signal<UserProfile>({
    name: 'Alex Van Berg',
    email: 'alex.vanberg@email.be',
    avatar: 'AV',
    city: 'Brussels',
    memberSince: '2024-03-15',
    bio: 'Event enthusiast exploring the best of Belgium!'
  });

  protected readonly stats = signal({
    eventsAttended: 24,
    ratingsGiven: 18,
    reviewsWritten: 12,
    citiesVisited: 4
  });

  protected readonly favoriteCategories = signal<FavoriteCategory[]>([
    { id: 'music', name: 'Music', color: '#FF6B5B', count: 8 },
    { id: 'food', name: 'Food', color: '#FFD93D', count: 6 },
    { id: 'culture', name: 'Culture', color: '#9B7EDE', count: 5 },
    { id: 'art', name: 'Art', color: '#FFB5C5', count: 3 },
    { id: 'sports', name: 'Sports', color: '#6BCAB3', count: 2 }
  ]);

  protected readonly achievements = signal<Achievement[]>([
    { id: 'first_rating', title: 'First Rating', description: 'Rate your first event', icon: 'star', unlocked: true },
    { id: 'explorer', title: 'City Explorer', description: 'Visit events in 3 cities', icon: 'location', unlocked: true },
    { id: 'reviewer', title: 'Storyteller', description: 'Write 10 reviews', icon: 'chat', unlocked: true, progress: 12, total: 10 },
    { id: 'regular', title: 'Event Regular', description: 'Attend 25 events', icon: 'calendar', unlocked: false, progress: 24, total: 25 },
    { id: 'critic', title: 'Trusted Critic', description: 'Get 50 helpful votes', icon: 'thumb', unlocked: false, progress: 23, total: 50 },
    { id: 'pioneer', title: 'Pioneer', description: 'Be first to rate a new event', icon: 'flag', unlocked: false }
  ]);

  protected readonly recentActivity = signal([
    { type: 'rating', event: 'Jazz Nights', city: 'Brussels', score: 5, date: '2024-12-28' },
    { type: 'checkin', event: 'Winter Market', city: 'Brussels', date: '2024-12-20' },
    { type: 'review', event: 'Magritte Expo', city: 'Brussels', date: '2024-12-15' },
    { type: 'rating', event: 'Light Festival', city: 'Ghent', score: 5, date: '2024-12-23' },
    { type: 'checkin', event: 'Street Food Fest', city: 'Antwerp', date: '2024-12-21' }
  ]);

  protected readonly settings = signal([
    { id: 'notifications', label: 'Push Notifications', enabled: true },
    { id: 'emails', label: 'Email Updates', enabled: false },
    { id: 'location', label: 'Location Services', enabled: true },
    { id: 'public', label: 'Public Profile', enabled: true }
  ]);

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  formatMemberSince(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  }

  toggleSetting(settingId: string): void {
    const updated = this.settings().map(s => 
      s.id === settingId ? { ...s, enabled: !s.enabled } : s
    );
    this.settings.set(updated);
  }

  getProgressWidth(progress: number, total: number): number {
    return Math.min((progress / total) * 100, 100);
  }
}

