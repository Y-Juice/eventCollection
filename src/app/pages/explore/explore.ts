import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService, EventWithRelations, City, Category } from '../../services/supabase.service';
import { ApiService } from '../../services/api.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-explore',
  imports: [CommonModule, FormsModule],
  templateUrl: './explore.html',
  styleUrl: './explore.css'
})
export class Explore implements OnInit {
  private supabase = inject(SupabaseService);
  private apiService = inject(ApiService);
  private router = inject(Router);
  private useLocalApi = environment.useLocalApi || false;
  protected readonly searchQuery = signal<string>('');
  protected readonly selectedCity = signal<string>('all');
  protected readonly selectedCategory = signal<string>('all');
  protected readonly sortBy = signal<'rating' | 'visitors' | 'reviews' | 'date'>('rating');
  protected readonly minRating = signal<number>(0);
  protected readonly showFilters = signal<boolean>(false);

  protected readonly cities = signal<Array<{id: string, name: string}>>([]);
  protected readonly categories = signal<Array<{id: string, name: string, color: string}>>([]);
  protected readonly loading = signal<boolean>(true);

  async ngOnInit() {
    try {
      // Load cities
      const citiesData = this.useLocalApi
        ? await this.apiService.getCities()
        : await this.supabase.getCities();
      this.cities.set([
        { id: 'all', name: 'All Cities' },
        ...citiesData.map(c => ({ id: c.id, name: c.name }))
      ]);
      
      // Load categories
      const categoriesData = this.useLocalApi
        ? await this.apiService.getCategories()
        : await this.supabase.getCategories();
      this.categories.set([
        { id: 'all', name: 'All', color: '#7B68C8' },
        ...categoriesData.map(c => ({ id: c.id, name: c.name, color: c.color }))
      ]);
      
      // Load all events
      await this.loadEvents();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async loadEvents() {
    try {
      const events = this.useLocalApi
        ? await this.apiService.getEvents()
        : await this.supabase.getEvents();
      this.allEvents.set(events as EventWithRelations[]);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  }

  protected readonly sortOptions = signal<{id: 'rating' | 'visitors' | 'reviews' | 'date', name: string}[]>([
    { id: 'rating', name: 'Top Rated' },
    { id: 'visitors', name: 'Most Popular' },
    { id: 'reviews', name: 'Most Reviewed' },
    { id: 'date', name: 'Upcoming' }
  ]);

  // All events database
  protected readonly allEvents = signal<EventWithRelations[]>([]);
  
  // Filtered and sorted events
  protected readonly filteredEvents = computed(() => {
    const search = this.searchQuery().toLowerCase();
    const city = this.selectedCity();
    const category = this.selectedCategory();
    const sort = this.sortBy();
    const minRating = this.minRating();

    let events = this.allEvents().filter(event => {
      const searchMatch = search === '' || 
        event.title.toLowerCase().includes(search) ||
        (event.subtitle && event.subtitle.toLowerCase().includes(search)) ||
        (event.city?.name && event.city.name.toLowerCase().includes(search)) ||
        (event.neighborhood && event.neighborhood.toLowerCase().includes(search));
      
      const cityMatch = city === 'all' || event.city_id === city;
      const categoryMatch = category === 'all' || event.category_id === category;
      const ratingMatch = (event.avg_rating || 0) >= minRating;

      return searchMatch && cityMatch && categoryMatch && ratingMatch;
    });

    // Sort events
    switch (sort) {
      case 'rating':
        events = events.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
        break;
      case 'visitors':
        events = events.sort((a, b) => (b.visitor_count || 0) - (a.visitor_count || 0));
        break;
      case 'reviews':
        events = events.sort((a, b) => (b.review_count || 0) - (a.review_count || 0));
        break;
      case 'date':
        events = events.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
        break;
    }

    return events;
  });

  // Stats
  protected readonly totalResults = computed(() => this.filteredEvents().length);
  protected readonly totalEvents = computed(() => this.allEvents().length);

  updateSearch(event: any): void {
    if (typeof event === 'string') {
      this.searchQuery.set(event);
    } else {
      this.searchQuery.set(event.target.value);
    }
  }

  selectCity(cityId: string): void {
    this.selectedCity.set(cityId);
  }

  selectCategory(categoryId: string): void {
    this.selectedCategory.set(categoryId);
  }

  setSortBy(sortId: 'rating' | 'visitors' | 'reviews' | 'date'): void {
    this.sortBy.set(sortId);
  }

  setMinRating(rating: number): void {
    this.minRating.set(rating);
  }

  toggleFilters(): void {
    this.showFilters.set(!this.showFilters());
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedCity.set('all');
    this.selectedCategory.set('all');
    this.sortBy.set('rating');
    this.minRating.set(0);
  }

  getCategoryColor(categoryId: string): string {
    const category = this.categories().find(c => c.id === categoryId);
    return category?.color || '#7B68C8';
  }

  getCategoryName(event: EventWithRelations): string {
    return event.category_id || '';
  }

  getCityName(event: EventWithRelations): string {
    return event.city?.name || '';
  }

  formatVisitors(count: number): string {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'k';
    }
    return count.toString();
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  formatTime(timeStr: string): string {
    return timeStr;
  }

  openEvent(event: EventWithRelations): void {
    this.router.navigate(['/event', event.id]);
  }
}
