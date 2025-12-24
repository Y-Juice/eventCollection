import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

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
export class Analytics {
  // Overall stats
  protected readonly overallStats = signal({
    totalEvents: 167,
    totalVisitors: 48520,
    totalRatings: 3847,
    avgRating: 4.52,
    dropOffRate: 23.5,
    engagementRate: 76.5
  });

  // Category statistics
  protected readonly categoryStats = signal<CategoryStats[]>([
    { id: 'music', name: 'Music', color: '#FF6B5B', eventCount: 45, avgRating: 4.5, totalVisitors: 12400, totalReviews: 1023 },
    { id: 'food', name: 'Food', color: '#FFD93D', eventCount: 38, avgRating: 4.4, totalVisitors: 15200, totalReviews: 987 },
    { id: 'culture', name: 'Culture', color: '#9B7EDE', eventCount: 32, avgRating: 4.7, totalVisitors: 8900, totalReviews: 756 },
    { id: 'sports', name: 'Sports', color: '#6BCAB3', eventCount: 28, avgRating: 4.3, totalVisitors: 9800, totalReviews: 654 },
    { id: 'art', name: 'Art', color: '#FFB5C5', eventCount: 24, avgRating: 4.6, totalVisitors: 2220, totalReviews: 427 }
  ]);

  // City statistics
  protected readonly cityStats = signal<CityStats[]>([
    { name: 'Brussels', eventCount: 47, avgRating: 4.6, totalVisitors: 18500, engagementRate: 82 },
    { name: 'Antwerp', eventCount: 35, avgRating: 4.5, totalVisitors: 12300, engagementRate: 78 },
    { name: 'Ghent', eventCount: 28, avgRating: 4.7, totalVisitors: 9800, engagementRate: 85 },
    { name: 'Bruges', eventCount: 22, avgRating: 4.4, totalVisitors: 4200, engagementRate: 71 },
    { name: 'Leuven', eventCount: 19, avgRating: 4.3, totalVisitors: 2400, engagementRate: 68 },
    { name: 'Liège', eventCount: 16, avgRating: 4.5, totalVisitors: 1320, engagementRate: 74 }
  ]);

  // Top 5 popular events
  protected readonly topEvents = signal<TopEvent[]>([
    { id: 5, title: 'RSC Anderlecht vs Club Brugge', city: 'Brussels', category: 'sports', visitors: 18500, rating: 4.3, reviews: 234, color: '#6BCAB3' },
    { id: 11, title: 'Light Festival', city: 'Ghent', category: 'culture', visitors: 5600, rating: 4.9, reviews: 423, color: '#9B7EDE' },
    { id: 18, title: 'Village de Noël', city: 'Liège', category: 'food', visitors: 4200, rating: 4.5, reviews: 345, color: '#FFD93D' },
    { id: 10, title: 'Antwerp Giants', city: 'Antwerp', category: 'sports', visitors: 3200, rating: 4.2, reviews: 89, color: '#6BCAB3' },
    { id: 16, title: 'Student Fest', city: 'Leuven', category: 'music', visitors: 3200, rating: 4.3, reviews: 567, color: '#FF6B5B' }
  ]);

  // Monthly data
  protected readonly monthlyData = signal<MonthlyData[]>([
    { month: 'July', shortMonth: 'Jul', eventCount: 12, avgRating: 4.3 },
    { month: 'August', shortMonth: 'Aug', eventCount: 18, avgRating: 4.4 },
    { month: 'September', shortMonth: 'Sep', eventCount: 22, avgRating: 4.5 },
    { month: 'October', shortMonth: 'Oct', eventCount: 28, avgRating: 4.4 },
    { month: 'November', shortMonth: 'Nov', eventCount: 35, avgRating: 4.6 },
    { month: 'December', shortMonth: 'Dec', eventCount: 52, avgRating: 4.7 }
  ]);

  // Quality vs Quantity analysis (high visitors, low ratings)
  protected readonly qualityIssues = signal<QualityEvent[]>([
    { id: 5, title: 'RSC Anderlecht', visitors: 18500, rating: 4.3, category: 'sports', color: '#6BCAB3' },
    { id: 10, title: 'Antwerp Giants', visitors: 3200, rating: 4.2, category: 'sports', color: '#6BCAB3' },
    { id: 16, title: 'Student Fest', visitors: 3200, rating: 4.3, category: 'music', color: '#FF6B5B' }
  ]);

  // Low engagement events (many views, few ratings)
  protected readonly lowEngagement = signal([
    { title: 'Canal Cruise', views: 1250, ratings: 289, rate: 23.1 },
    { title: 'Beer Tasting', views: 890, ratings: 198, rate: 22.2 },
    { title: 'Opera Night', views: 320, ratings: 56, rate: 17.5 }
  ]);

  // Time analysis
  protected readonly timeAnalysis = signal([
    { day: 'Friday', avgRating: 4.7, eventCount: 38 },
    { day: 'Saturday', avgRating: 4.6, eventCount: 45 },
    { day: 'Sunday', avgRating: 4.4, eventCount: 32 },
    { day: 'Weekdays', avgRating: 4.3, eventCount: 52 }
  ]);

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

