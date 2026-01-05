import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService, UserProfile, EventWithRelations, Rating, Category, City } from '../../services/supabase.service';

interface UserWithStats extends UserProfile {
  ratingCount: number;
  visitCount: number;
  avgRating: number;
  lastActivity: string;
}

interface RatingWithDetails extends Rating {
  userName?: string;
  eventTitle?: string;
}

type TabType = 'users' | 'events' | 'ratings' | 'activity';
type UserAction = 'view' | 'warn' | 'suspend' | 'delete';

@Component({
  selector: 'app-admin',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class Admin implements OnInit {
  private supabase = inject(SupabaseService);
  
  // Loading state
  protected readonly loading = signal<boolean>(true);
  protected readonly actionLoading = signal<boolean>(false);
  
  // Active tab
  protected readonly activeTab = signal<TabType>('users');
  
  // Data signals
  protected readonly users = signal<UserWithStats[]>([]);
  protected readonly events = signal<EventWithRelations[]>([]);
  protected readonly ratings = signal<RatingWithDetails[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly cities = signal<City[]>([]);
  
  // Selection state
  protected readonly selectedUsers = signal<Set<string>>(new Set());
  protected readonly selectedEvents = signal<Set<string>>(new Set());
  protected readonly selectedRatings = signal<Set<string>>(new Set());
  
  // Filter state
  protected readonly userSearch = signal<string>('');
  protected readonly userCityFilter = signal<string>('');
  protected readonly eventCategoryFilter = signal<string>('');
  protected readonly eventCityFilter = signal<string>('');
  protected readonly ratingScoreFilter = signal<number>(0);
  protected readonly dateRangeStart = signal<string>('');
  protected readonly dateRangeEnd = signal<string>('');
  
  // Modal state
  protected readonly showUserModal = signal<boolean>(false);
  protected readonly showEventModal = signal<boolean>(false);
  protected readonly showConfirmModal = signal<boolean>(false);
  protected readonly selectedUser = signal<UserWithStats | null>(null);
  protected readonly selectedEvent = signal<EventWithRelations | null>(null);
  protected readonly confirmAction = signal<{type: string, message: string, callback: () => void} | null>(null);
  
  // Stats
  protected readonly stats = signal({
    totalUsers: 0,
    activeUsers: 0,
    totalEvents: 0,
    totalRatings: 0,
    avgRating: 0,
    flaggedContent: 0
  });

  async ngOnInit() {
    try {
      await this.loadAllData();
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async loadAllData() {
    const [categoriesData, citiesData, eventsData, ratingsData] = await Promise.all([
      this.supabase.getCategories(),
      this.supabase.getCities(),
      this.supabase.getEvents(),
      this.loadAllRatings()
    ]);

    this.categories.set(categoriesData);
    this.cities.set(citiesData);
    this.events.set(eventsData);
    
    // Load users with stats
    await this.loadUsersWithStats(ratingsData);
    
    // Calculate stats
    this.calculateStats(eventsData, ratingsData);
  }

  async loadAllRatings(): Promise<Rating[]> {
    // Get all ratings from the service
    const ratings = await this.supabase.getAllRatings();
    
    // Enhance with user and event info
    const enhancedRatings: RatingWithDetails[] = ratings.map(r => ({
      ...r,
      userName: 'User',
      eventTitle: r.event?.title || 'Unknown Event'
    }));
    
    this.ratings.set(enhancedRatings);
    return ratings;
  }

  async loadUsersWithStats(ratings: Rating[]) {
    // Get unique user IDs from ratings
    const userIds = [...new Set(ratings.map(r => r.user_id))];
    
    // Create user stats map
    const userStatsMap = new Map<string, {ratingCount: number, ratings: number[], lastActivity: string}>();
    
    ratings.forEach(r => {
      const stats = userStatsMap.get(r.user_id) || {ratingCount: 0, ratings: [], lastActivity: ''};
      stats.ratingCount++;
      stats.ratings.push(r.score);
      if (!stats.lastActivity || r.created_at > stats.lastActivity) {
        stats.lastActivity = r.created_at;
      }
      userStatsMap.set(r.user_id, stats);
    });

    // Create user objects with stats
    const usersWithStats: UserWithStats[] = userIds.map(userId => {
      const stats = userStatsMap.get(userId)!;
      const avgRating = stats.ratings.length > 0 
        ? stats.ratings.reduce((a, b) => a + b, 0) / stats.ratings.length 
        : 0;
      
      return {
        id: userId,
        email: null,
        name: userId.startsWith('anon_') ? 'Anonymous User' : userId.substring(0, 8),
        avatar: null,
        city: null,
        bio: null,
        ratingCount: stats.ratingCount,
        visitCount: 0,
        avgRating: parseFloat(avgRating.toFixed(1)),
        lastActivity: stats.lastActivity
      };
    });

    this.users.set(usersWithStats);
  }

  calculateStats(events: EventWithRelations[], ratings: Rating[]) {
    const totalRatings = ratings.length;
    const avgRating = totalRatings > 0
      ? ratings.reduce((sum, r) => sum + r.score, 0) / totalRatings
      : 0;
    
    // Count low ratings as potentially flagged
    const flaggedContent = ratings.filter(r => r.score <= 2).length;
    
    // Count users active in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeUsers = this.users().filter(u => 
      new Date(u.lastActivity) >= thirtyDaysAgo
    ).length;

    this.stats.set({
      totalUsers: this.users().length,
      activeUsers,
      totalEvents: events.length,
      totalRatings,
      avgRating: parseFloat(avgRating.toFixed(2)),
      flaggedContent
    });
  }

  // Tab switching
  setActiveTab(tab: TabType) {
    this.activeTab.set(tab);
    this.clearSelections();
  }

  // Selection methods
  toggleUserSelection(userId: string) {
    const selected = new Set(this.selectedUsers());
    if (selected.has(userId)) {
      selected.delete(userId);
    } else {
      selected.add(userId);
    }
    this.selectedUsers.set(selected);
  }

  toggleEventSelection(eventId: string) {
    const selected = new Set(this.selectedEvents());
    if (selected.has(eventId)) {
      selected.delete(eventId);
    } else {
      selected.add(eventId);
    }
    this.selectedEvents.set(selected);
  }

  toggleRatingSelection(ratingId: string) {
    const selected = new Set(this.selectedRatings());
    if (selected.has(ratingId)) {
      selected.delete(ratingId);
    } else {
      selected.add(ratingId);
    }
    this.selectedRatings.set(selected);
  }

  selectAllUsers() {
    const allIds = new Set(this.filteredUsers().map(u => u.id));
    this.selectedUsers.set(allIds);
  }

  selectAllEvents() {
    const allIds = new Set(this.filteredEvents().map(e => e.id));
    this.selectedEvents.set(allIds);
  }

  selectAllRatings() {
    const allIds = new Set(this.filteredRatings().map(r => r.id));
    this.selectedRatings.set(allIds);
  }

  clearSelections() {
    this.selectedUsers.set(new Set());
    this.selectedEvents.set(new Set());
    this.selectedRatings.set(new Set());
  }

  // Filtered data computed
  protected readonly filteredUsers = computed(() => {
    let result = this.users();
    
    const search = this.userSearch().toLowerCase();
    if (search) {
      result = result.filter(u => 
        u.name?.toLowerCase().includes(search) ||
        u.email?.toLowerCase().includes(search) ||
        u.id.toLowerCase().includes(search)
      );
    }
    
    const city = this.userCityFilter();
    if (city) {
      result = result.filter(u => u.city === city);
    }
    
    return result;
  });

  protected readonly filteredEvents = computed(() => {
    let result = this.events();
    
    const category = this.eventCategoryFilter();
    if (category) {
      result = result.filter(e => e.category_id === category);
    }
    
    const city = this.eventCityFilter();
    if (city) {
      result = result.filter(e => e.city_id === city);
    }
    
    const startDate = this.dateRangeStart();
    if (startDate) {
      result = result.filter(e => e.event_date >= startDate);
    }
    
    const endDate = this.dateRangeEnd();
    if (endDate) {
      result = result.filter(e => e.event_date <= endDate);
    }
    
    return result;
  });

  protected readonly filteredRatings = computed(() => {
    let result = this.ratings();
    
    const minScore = this.ratingScoreFilter();
    if (minScore > 0) {
      result = result.filter(r => r.score >= minScore);
    }
    
    return result;
  });

  // Modal methods
  openUserDetails(user: UserWithStats) {
    this.selectedUser.set(user);
    this.showUserModal.set(true);
  }

  openEventDetails(event: EventWithRelations) {
    this.selectedEvent.set(event);
    this.showEventModal.set(true);
  }

  closeModals() {
    this.showUserModal.set(false);
    this.showEventModal.set(false);
    this.showConfirmModal.set(false);
    this.selectedUser.set(null);
    this.selectedEvent.set(null);
    this.confirmAction.set(null);
  }

  // Action methods
  confirmDeleteUsers() {
    const count = this.selectedUsers().size;
    this.confirmAction.set({
      type: 'delete',
      message: `Are you sure you want to delete ${count} user(s)? This action cannot be undone.`,
      callback: () => this.deleteSelectedUsers()
    });
    this.showConfirmModal.set(true);
  }

  confirmDeleteEvents() {
    const count = this.selectedEvents().size;
    this.confirmAction.set({
      type: 'delete',
      message: `Are you sure you want to delete ${count} event(s)? This action cannot be undone.`,
      callback: () => this.deleteSelectedEvents()
    });
    this.showConfirmModal.set(true);
  }

  confirmDeleteRatings() {
    const count = this.selectedRatings().size;
    this.confirmAction.set({
      type: 'delete',
      message: `Are you sure you want to delete ${count} rating(s)? This action cannot be undone.`,
      callback: () => this.deleteSelectedRatings()
    });
    this.showConfirmModal.set(true);
  }

  async executeConfirmAction() {
    const action = this.confirmAction();
    if (action) {
      this.actionLoading.set(true);
      try {
        await action.callback();
      } catch (error) {
        console.error('Action failed:', error);
      } finally {
        this.actionLoading.set(false);
        this.closeModals();
      }
    }
  }

  async deleteSelectedUsers() {
    // In a real app, this would call the API to delete users
    const selected = this.selectedUsers();
    const remaining = this.users().filter(u => !selected.has(u.id));
    this.users.set(remaining);
    this.selectedUsers.set(new Set());
    this.calculateStats(this.events(), this.ratings());
  }

  async deleteSelectedEvents() {
    const selected = this.selectedEvents();
    for (const eventId of selected) {
      try {
        await this.supabase.deleteEvent(eventId);
      } catch (error) {
        console.error('Failed to delete event:', eventId, error);
      }
    }
    const remaining = this.events().filter(e => !selected.has(e.id));
    this.events.set(remaining);
    this.selectedEvents.set(new Set());
    this.calculateStats(remaining, this.ratings());
  }

  async deleteSelectedRatings() {
    const selected = this.selectedRatings();
    for (const ratingId of selected) {
      try {
        await this.supabase.deleteRating(ratingId);
      } catch (error) {
        console.error('Failed to delete rating:', ratingId, error);
      }
    }
    const remaining = this.ratings().filter(r => !selected.has(r.id));
    this.ratings.set(remaining);
    this.selectedRatings.set(new Set());
  }

  // Export methods
  exportUsers() {
    const data = this.filteredUsers().map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      city: u.city,
      ratingCount: u.ratingCount,
      avgRating: u.avgRating,
      lastActivity: u.lastActivity
    }));
    this.downloadCSV(data, 'users_export.csv');
  }

  exportEvents() {
    const data = this.filteredEvents().map(e => ({
      id: e.id,
      title: e.title,
      category: e.category?.name,
      city: e.city?.name,
      date: e.event_date,
      time: e.event_time,
      avgRating: e.avg_rating,
      visitors: e.visitor_count
    }));
    this.downloadCSV(data, 'events_export.csv');
  }

  exportRatings() {
    const data = this.filteredRatings().map(r => ({
      id: r.id,
      eventTitle: r.eventTitle,
      userId: r.user_id,
      score: r.score,
      review: r.review,
      wasPresent: r.was_present,
      createdAt: r.created_at
    }));
    this.downloadCSV(data, 'ratings_export.csv');
  }

  private downloadCSV(data: any[], filename: string) {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }

  // Utility methods
  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getScoreClass(score: number): string {
    if (score >= 4) return 'score-high';
    if (score >= 3) return 'score-medium';
    return 'score-low';
  }

  getUserInitials(name: string | null): string {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }
}

