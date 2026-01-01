import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService, EventWithRelations, City, Category } from '../../services/supabase.service';
import { UserTrackingService } from '../../services/user-tracking.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  private supabase = inject(SupabaseService);
  private trackingService = inject(UserTrackingService);
  protected readonly cities = signal<City[]>([]);
  protected readonly selectedCity = signal<string>('Brussels');
  protected readonly categories = signal<Category[]>([]);
  protected readonly selectedCategory = signal<string>('all');
  protected readonly allEvents = signal<EventWithRelations[]>([]);
  protected readonly loading = signal<boolean>(true);

  async ngOnInit() {
    try {
      // Track page view
      await this.trackingService.trackEvent({
        event_type: 'page_view',
        event_category: 'navigation',
        route_path: '/',
        metadata: { page: 'home' }
      });

      // Load cities
      const citiesData = await this.supabase.getCities();
      this.cities.set(citiesData);
      
      // Load categories and add "all" option
      const categoriesData = await this.supabase.getCategories();
      this.categories.set([
        { id: 'all', name: 'All', color: '#000000' },
        ...categoriesData
      ]);
      
      // Load events
      await this.loadEvents();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async loadEvents() {
    try {
      const city = this.cities().find(c => c.name === this.selectedCity());
      const events = await this.supabase.getEvents({
        cityId: city?.id,
        categoryId: this.selectedCategory() !== 'all' ? this.selectedCategory() : undefined
      });
      this.allEvents.set(events);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  }

  async selectCity(cityName: string): Promise<void> {
    this.selectedCity.set(cityName);
    
    // Track filter change
    await this.trackingService.trackEvent({
      event_type: 'filter_change',
      event_category: 'interaction',
      element_type: 'filter',
      element_id: 'city_filter',
      metadata: {
        filter_type: 'city',
        filter_value: cityName,
        previous_value: this.selectedCity()
      }
    });
    
    await this.loadEvents();
  }

  async selectCategory(categoryId: string): Promise<void> {
    this.selectedCategory.set(categoryId);
    
    // Track filter change
    await this.trackingService.trackEvent({
      event_type: 'filter_change',
      event_category: 'interaction',
      element_type: 'filter',
      element_id: 'category_filter',
      metadata: {
        filter_type: 'category',
        filter_value: categoryId,
        previous_value: this.selectedCategory()
      }
    });
    
    await this.loadEvents();
  }

  async trackEventClick(event: EventWithRelations): Promise<void> {
    await this.trackingService.trackEvent({
      event_type: 'event_click',
      event_category: 'content',
      element_type: 'event_card',
      element_id: event.id,
      metadata: {
        event_id: event.id,
        event_title: event.title,
        event_category: event.category?.name,
        event_city: event.city?.name,
        event_date: event.event_date
      }
    });
  }

  // Helper methods to get category/city names for template compatibility
  getCategoryName(event: EventWithRelations): string {
    return event.category?.id || event.category_id || '';
  }

  getCityName(event: EventWithRelations): string {
    return event.city?.name || '';
  }

  // Filtered events based on selected city and category
  protected readonly filteredEvents = computed(() => {
    const category = this.selectedCategory();
    if (category === 'all') {
      return this.allEvents();
    }
    return this.allEvents().filter(event => event.category_id === category);
  });

  // City stats
  protected readonly cityStats = computed(() => {
    const cityEvents = this.allEvents();
    const totalVisitors = cityEvents.reduce((sum, e) => sum + (e.visitor_count || 0), 0);
    const avgRating = cityEvents.length > 0 
      ? cityEvents.reduce((sum, e) => sum + (e.avg_rating || 0), 0) / cityEvents.length 
      : 0;
    
    return {
      eventCount: cityEvents.length,
      totalVisitors,
      avgRating: avgRating.toFixed(1)
    };
  });

  // Featured event for selected city
  protected readonly featuredEvent = computed(() => {
    const events = this.allEvents();
    if (events.length === 0) return null;
    
    // Return highest rated event
    return events.reduce((best, current) => 
      (current.avg_rating || 0) > (best.avg_rating || 0) ? current : best
    );
  });

  // Get city event count
  getCityEventCount(cityName: string): number {
    return this.allEvents().filter(e => e.city?.name === cityName).length;
  }

  formatVisitors(count: number): string {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'k';
    }
    return count.toString();
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }
}
