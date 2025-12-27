import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService, EventWithRelations, Category, City } from '../../services/supabase.service';

interface CategoryStats {
  id: string;
  name: string;
  color: string;
  eventCount: number;
  avgRating: number;
  totalVisitors: number;
  totalReviews: number;
}

interface CityStats {
  name: string;
  eventCount: number;
  avgRating: number;
  totalVisitors: number;
  engagementRate: number;
}

interface TopEvent {
  id: number;
  title: string;
  city: string;
  category: string;
  visitors: number;
  rating: number;
  reviews: number;
  color: string;
}

interface MonthlyData {
  month: string;
  shortMonth: string;
  eventCount: number;
  avgRating: number;
}

interface QualityEvent {
  id: number;
  title: string;
  visitors: number;
  rating: number;
  category: string;
  color: string;
}

@Component({
  selector: 'app-analytics',
  imports: [CommonModule],
  templateUrl: './analytics.html',
  styleUrl: './analytics.css'
})
export class Analytics implements OnInit {
  private supabase = inject(SupabaseService);
  protected readonly loading = signal<boolean>(true);
  
  // Overall stats
  protected readonly overallStats = signal({
    totalEvents: 0,
    totalVisitors: 0,
    totalRatings: 0,
    avgRating: 0,
    dropOffRate: 0,
    engagementRate: 0
  });

  protected readonly allEvents = signal<EventWithRelations[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly cities = signal<City[]>([]);

  // Category statistics
  protected readonly categoryStats = signal<CategoryStats[]>([]);

  // City statistics
  protected readonly cityStats = signal<CityStats[]>([]);

  // Top 5 popular events
  protected readonly topEvents = signal<TopEvent[]>([]);

  // Monthly data
  protected readonly monthlyData = signal<MonthlyData[]>([]);

  // Quality vs Quantity analysis (high visitors, low ratings)
  protected readonly qualityIssues = signal<QualityEvent[]>([]);

  // Low engagement events (many views, few ratings)
  protected readonly lowEngagement = signal<Array<{title: string, views: number, ratings: number, rate: number}>>([]);

  // Time analysis
  protected readonly timeAnalysis = signal<Array<{day: string, avgRating: number, eventCount: number}>>([]);

  async ngOnInit() {
    try {
      await this.loadData();
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async loadData() {
    // Load all events
    const events = await this.supabase.getEvents();
    this.allEvents.set(events);

    // Load categories
    const categoriesData = await this.supabase.getCategories();
    this.categories.set(categoriesData);

    // Load cities
    const citiesData = await this.supabase.getCities();
    this.cities.set(citiesData);

    // Calculate overall stats
    this.calculateOverallStats(events);

    // Calculate category stats
    this.calculateCategoryStats(events, categoriesData);

    // Calculate city stats
    this.calculateCityStats(events, citiesData);

    // Calculate top events
    this.calculateTopEvents(events);

    // Calculate monthly data
    this.calculateMonthlyData(events);

    // Calculate quality issues
    this.calculateQualityIssues(events);

    // Calculate low engagement
    this.calculateLowEngagement(events);

    // Calculate time analysis
    this.calculateTimeAnalysis(events);
  }

  calculateOverallStats(events: EventWithRelations[]) {
    const totalEvents = events.length;
    const totalVisitors = events.reduce((sum, e) => sum + (e.visitor_count || 0), 0);
    const totalRatings = events.reduce((sum, e) => sum + (e.review_count || 0), 0);
    const avgRating = events.length > 0
      ? events.reduce((sum, e) => sum + (e.avg_rating || 0), 0) / events.length
      : 0;
    
    const totalViews = events.reduce((sum, e) => sum + (e.view_count || 0), 0);
    const engagementRate = totalViews > 0 ? (totalRatings / totalViews) * 100 : 0;
    const dropOffRate = 100 - engagementRate;

    this.overallStats.set({
      totalEvents,
      totalVisitors,
      totalRatings,
      avgRating: parseFloat(avgRating.toFixed(2)),
      dropOffRate: parseFloat(dropOffRate.toFixed(1)),
      engagementRate: parseFloat(engagementRate.toFixed(1))
    });
  }

  calculateCategoryStats(events: EventWithRelations[], categories: Category[]) {
    const stats = categories.map(cat => {
      const categoryEvents = events.filter(e => e.category_id === cat.id);
      const eventCount = categoryEvents.length;
      const totalVisitors = categoryEvents.reduce((sum, e) => sum + (e.visitor_count || 0), 0);
      const totalReviews = categoryEvents.reduce((sum, e) => sum + (e.review_count || 0), 0);
      const avgRating = eventCount > 0
        ? categoryEvents.reduce((sum, e) => sum + (e.avg_rating || 0), 0) / eventCount
        : 0;

      return {
        id: cat.id,
        name: cat.name,
        color: cat.color,
        eventCount,
        avgRating: parseFloat(avgRating.toFixed(1)),
        totalVisitors,
        totalReviews
      };
    });

    this.categoryStats.set(stats);
  }

  calculateCityStats(events: EventWithRelations[], cities: City[]) {
    const stats = cities.map(city => {
      const cityEvents = events.filter(e => e.city_id === city.id);
      const eventCount = cityEvents.length;
      const totalVisitors = cityEvents.reduce((sum, e) => sum + (e.visitor_count || 0), 0);
      const avgRating = eventCount > 0
        ? cityEvents.reduce((sum, e) => sum + (e.avg_rating || 0), 0) / eventCount
        : 0;
      
      const totalViews = cityEvents.reduce((sum, e) => sum + (e.view_count || 0), 0);
      const totalRatings = cityEvents.reduce((sum, e) => sum + (e.review_count || 0), 0);
      const engagementRate = totalViews > 0 ? (totalRatings / totalViews) * 100 : 0;

      return {
        name: city.name,
        eventCount,
        avgRating: parseFloat(avgRating.toFixed(1)),
        totalVisitors,
        engagementRate: parseFloat(engagementRate.toFixed(0))
      };
    });

    this.cityStats.set(stats);
  }

  calculateTopEvents(events: EventWithRelations[]) {
    const sorted = [...events].sort((a, b) => (b.visitor_count || 0) - (a.visitor_count || 0));
    const top5 = sorted.slice(0, 5).map((e, index) => ({
      id: index + 1,
      title: e.title,
      city: e.city?.name || '',
      category: e.category_id,
      visitors: e.visitor_count || 0,
      rating: e.avg_rating || 0,
      reviews: e.review_count || 0,
      color: e.color
    }));

    this.topEvents.set(top5);
  }

  calculateMonthlyData(events: EventWithRelations[]) {
    const monthMap = new Map<string, {count: number, ratings: number[]}>();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    events.forEach(event => {
      const date = new Date(event.event_date);
      const month = monthNames[date.getMonth()];
      const shortMonth = shortMonths[date.getMonth()];
      
      if (!monthMap.has(month)) {
        monthMap.set(month, { count: 0, ratings: [] });
      }
      
      const data = monthMap.get(month)!;
      data.count++;
      if (event.avg_rating) {
        data.ratings.push(event.avg_rating);
      }
    });

    const monthlyData = Array.from(monthMap.entries()).map(([month, data]) => {
      const monthIndex = monthNames.indexOf(month);
      const avgRating = data.ratings.length > 0
        ? data.ratings.reduce((sum, r) => sum + r, 0) / data.ratings.length
        : 0;

      return {
        month,
        shortMonth: shortMonths[monthIndex],
        eventCount: data.count,
        avgRating: parseFloat(avgRating.toFixed(1))
      };
    }).sort((a, b) => monthNames.indexOf(a.month) - monthNames.indexOf(b.month));

    this.monthlyData.set(monthlyData);
  }

  calculateQualityIssues(events: EventWithRelations[]) {
    const issues = events
      .filter(e => (e.visitor_count || 0) > 1000 && (e.avg_rating || 0) < 4.5)
      .sort((a, b) => (b.visitor_count || 0) - (a.visitor_count || 0))
      .slice(0, 3)
      .map((e, index) => ({
        id: index + 1,
        title: e.title,
        visitors: e.visitor_count || 0,
        rating: e.avg_rating || 0,
        category: e.category_id,
        color: e.color
      }));

    this.qualityIssues.set(issues);
  }

  calculateLowEngagement(events: EventWithRelations[]) {
    const lowEng = events
      .filter(e => (e.view_count || 0) > 0 && (e.review_count || 0) > 0)
      .map(e => {
        const rate = (e.review_count || 0) / (e.view_count || 1) * 100;
        return {
          title: e.title,
          views: e.view_count || 0,
          ratings: e.review_count || 0,
          rate: parseFloat(rate.toFixed(1))
        };
      })
      .filter(e => e.rate < 30)
      .sort((a, b) => a.rate - b.rate)
      .slice(0, 3);

    this.lowEngagement.set(lowEng);
  }

  calculateTimeAnalysis(events: EventWithRelations[]) {
    const dayMap = new Map<string, {ratings: number[], count: number}>();
    
    events.forEach(event => {
      const date = new Date(event.event_date);
      const dayOfWeek = date.getDay();
      let dayName = '';
      
      if (dayOfWeek === 5) dayName = 'Friday';
      else if (dayOfWeek === 6) dayName = 'Saturday';
      else if (dayOfWeek === 0) dayName = 'Sunday';
      else dayName = 'Weekdays';

      if (!dayMap.has(dayName)) {
        dayMap.set(dayName, { ratings: [], count: 0 });
      }

      const data = dayMap.get(dayName)!;
      data.count++;
      if (event.avg_rating) {
        data.ratings.push(event.avg_rating);
      }
    });

    const timeAnalysis = Array.from(dayMap.entries()).map(([day, data]) => {
      const avgRating = data.ratings.length > 0
        ? data.ratings.reduce((sum, r) => sum + r, 0) / data.ratings.length
        : 0;

      return {
        day,
        avgRating: parseFloat(avgRating.toFixed(1)),
        eventCount: data.count
      };
    });

    this.timeAnalysis.set(timeAnalysis);
  }

  // Computed values
  protected readonly maxMonthlyEvents = computed(() => 
    Math.max(...this.monthlyData().map(m => m.eventCount))
  );

  protected readonly maxCityEvents = computed(() => 
    Math.max(...this.cityStats().map(c => c.eventCount))
  );

  protected readonly maxVisitors = computed(() => 
    Math.max(...this.topEvents().map(e => e.visitors))
  );

  protected readonly totalCategoryEvents = computed(() => 
    this.categoryStats().reduce((sum, c) => sum + c.eventCount, 0)
  );

  getBarWidth(value: number, max: number): number {
    return (value / max) * 100;
  }

  getDonutOffset(index: number): number {
    const stats = this.categoryStats();
    const total = this.totalCategoryEvents();
    let offset = 25; // Start at top
    for (let i = 0; i < index; i++) {
      offset -= (stats[i].eventCount / total) * 100;
    }
    return offset;
  }

  getDonutDashArray(eventCount: number): string {
    const total = this.totalCategoryEvents();
    const percentage = (eventCount / total) * 100;
    return `${percentage} ${100 - percentage}`;
  }

  formatNumber(num: number): string {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
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


