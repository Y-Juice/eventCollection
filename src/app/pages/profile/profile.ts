import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService, UserProfile, Category } from '../../services/supabase.service';

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
export class Profile implements OnInit {
  private supabase = inject(SupabaseService);
  protected readonly loading = signal<boolean>(true);

  protected readonly user = signal<{
    name: string;
    email: string;
    avatar: string;
    city: string;
    memberSince: string;
    bio: string;
  }>({
    name: '',
    email: '',
    avatar: '',
    city: '',
    memberSince: '',
    bio: ''
  });

  protected readonly stats = signal({
    eventsAttended: 0,
    ratingsGiven: 0,
    reviewsWritten: 0,
    citiesVisited: 0
  });

  protected readonly favoriteCategories = signal<FavoriteCategory[]>([]);

  protected readonly achievements = signal<Achievement[]>([]);

  protected readonly recentActivity = signal<Array<{
    type: string;
    event: string;
    city: string;
    score?: number;
    date: string;
  }>>([]);

  async ngOnInit() {
    try {
      await this.loadData();
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async loadData() {
    const currentUser = this.supabase.getCurrentUser();
    if (!currentUser) return;

    // Load user profile
    const profile = await this.supabase.getUserProfile(currentUser.id);
    if (profile) {
      const initials = profile.name ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';
      this.user.set({
        name: profile.name || 'User',
        email: profile.email || '',
        avatar: profile.avatar || initials,
        city: profile.city || '',
        memberSince: profile.created_at || new Date().toISOString(),
        bio: profile.bio || ''
      });
    }

    // Load visits and ratings
    const visits = await this.supabase.getUserVisits();
    const ratings = await this.supabase.getUserRatings();
    const reviews = ratings.filter(r => r.review && r.review.trim() !== '');

    // Calculate cities visited
    const citySet = new Set<string>();
    const allEvents = await this.supabase.getEvents();
    visits.forEach(v => {
      const event = allEvents.find(e => e.id === v.event_id);
      if (event?.city?.name) {
        citySet.add(event.city.name);
      }
    });

    this.stats.set({
      eventsAttended: visits.length,
      ratingsGiven: ratings.length,
      reviewsWritten: reviews.length,
      citiesVisited: citySet.size
    });

    // Calculate favorite categories
    const categoryMap = new Map<string, number>();
    ratings.forEach(r => {
      if (r.event?.category_id) {
        categoryMap.set(r.event.category_id, (categoryMap.get(r.event.category_id) || 0) + 1);
      }
    });

    const categories = await this.supabase.getCategories();
    const favoriteCategories = Array.from(categoryMap.entries())
      .map(([id, count]) => {
        const category = categories.find(c => c.id === id);
        return category ? { id, name: category.name, color: category.color, count } : null;
      })
      .filter((c): c is FavoriteCategory => c !== null)
      .sort((a, b) => b.count - a.count);

    this.favoriteCategories.set(favoriteCategories);

    // Calculate achievements
    this.calculateAchievements(ratings, reviews, visits);

    // Calculate recent activity
    await this.calculateRecentActivity(ratings, visits);
  }

  calculateAchievements(ratings: any[], reviews: any[], visits: any[]) {
    const achievements: Achievement[] = [
      {
        id: 'first_rating',
        title: 'First Rating',
        description: 'Rate your first event',
        icon: 'star',
        unlocked: ratings.length > 0
      },
      {
        id: 'explorer',
        title: 'City Explorer',
        description: 'Visit events in 3 cities',
        icon: 'location',
        unlocked: this.stats().citiesVisited >= 3,
        progress: this.stats().citiesVisited,
        total: 3
      },
      {
        id: 'reviewer',
        title: 'Storyteller',
        description: 'Write 10 reviews',
        icon: 'chat',
        unlocked: reviews.length >= 10,
        progress: reviews.length,
        total: 10
      },
      {
        id: 'regular',
        title: 'Event Regular',
        description: 'Attend 25 events',
        icon: 'calendar',
        unlocked: visits.length >= 25,
        progress: visits.length,
        total: 25
      },
      {
        id: 'critic',
        title: 'Trusted Critic',
        description: 'Get 50 helpful votes',
        icon: 'thumb',
        unlocked: false,
        progress: 0,
        total: 50
      },
      {
        id: 'pioneer',
        title: 'Pioneer',
        description: 'Be first to rate a new event',
        icon: 'flag',
        unlocked: false
      }
    ];

    this.achievements.set(achievements);
  }

  async calculateRecentActivity(ratings: any[], visits: any[]) {
    const activities: Array<{type: string, event: string, city: string, score?: number, date: string}> = [];
    const allEvents = await this.supabase.getEvents();

    // Add ratings
    ratings.slice(0, 3).forEach(r => {
      if (r.event) {
        activities.push({
          type: 'rating',
          event: r.event.title || '',
          city: r.event.city?.name || '',
          score: r.score,
          date: r.created_at
        });
      }
    });

    // Add visits
    visits.slice(0, 2).forEach(v => {
      const event = allEvents.find(e => e.id === v.event_id);
      if (event) {
        activities.push({
          type: 'checkin',
          event: event.title || '',
          city: event.city?.name || '',
          date: v.checked_in_at
        });
      }
    });

    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    this.recentActivity.set(activities.slice(0, 5));
  }

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


