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
  popularityScore: number;
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

interface TrendSignal {
  type: 'positive' | 'negative' | 'neutral';
  title: string;
  description: string;
  metric: string;
  change: number;
  icon: 'trending_up' | 'trending_down' | 'warning' | 'star' | 'calendar' | 'location';
}

interface CategoryTrend {
  name: string;
  color: string;
  recentAvgRating: number;
  olderAvgRating: number;
  ratingChange: number;
  recentEvents: number;
  olderEvents: number;
  growthRate: number;
  momentum: 'rising' | 'falling' | 'stable';
}

interface SeasonalPattern {
  season: string;
  eventCount: number;
  avgRating: number;
  bestCategory: string;
  bestCategoryColor: string;
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

  // Trend signals
  protected readonly trendSignals = signal<TrendSignal[]>([]);

  // Category trends (comparing recent vs older events)
  protected readonly categoryTrends = signal<CategoryTrend[]>([]);

  // Seasonal patterns
  protected readonly seasonalPatterns = signal<SeasonalPattern[]>([]);

  // Best performing month
  protected readonly bestMonth = signal<{month: string, reason: string}>({month: '', reason: ''});

  // Worst performing month
  protected readonly worstMonth = signal<{month: string, reason: string}>({month: '', reason: ''});

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

    // Calculate trend signals
    this.calculateTrendSignals(events, categoriesData);

    // Calculate category trends
    this.calculateCategoryTrends(events, categoriesData);

    // Calculate seasonal patterns
    this.calculateSeasonalPatterns(events, categoriesData);

    // Calculate best/worst months
    this.calculateBestWorstMonths(events);
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
    // Calculate popularity score: combine ratings count and visitors
    const eventsWithScore = events.map(e => ({
      ...e,
      popularityScore: (e.review_count || 0) * 2 + (e.visitor_count || 0)
    }));
    
    const sorted = eventsWithScore.sort((a, b) => b.popularityScore - a.popularityScore);
    const top5 = sorted.slice(0, 5).map((e, index) => ({
      id: index + 1,
      title: e.title,
      city: e.city?.name || '',
      category: e.category_id,
      visitors: e.visitor_count || 0,
      rating: e.avg_rating || 0,
      reviews: e.review_count || 0,
      popularityScore: e.popularityScore,
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

  calculateTrendSignals(events: EventWithRelations[], categories: Category[]) {
    const signals: TrendSignal[] = [];
    const now = new Date();
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

    // Split events into recent (last 3 months) and older (3-6 months ago)
    const recentEvents = events.filter(e => new Date(e.event_date) >= threeMonthsAgo);
    const olderEvents = events.filter(e => {
      const date = new Date(e.event_date);
      return date < threeMonthsAgo && date >= sixMonthsAgo;
    });

    // 1. Overall rating trend
    const recentAvgRating = recentEvents.length > 0
      ? recentEvents.reduce((sum, e) => sum + (e.avg_rating || 0), 0) / recentEvents.length
      : 0;
    const olderAvgRating = olderEvents.length > 0
      ? olderEvents.reduce((sum, e) => sum + (e.avg_rating || 0), 0) / olderEvents.length
      : 0;
    
    if (olderAvgRating > 0) {
      const ratingChange = ((recentAvgRating - olderAvgRating) / olderAvgRating) * 100;
      if (Math.abs(ratingChange) > 5) {
        signals.push({
          type: ratingChange > 0 ? 'positive' : 'negative',
          title: ratingChange > 0 ? 'Rating Improving' : 'Rating Declining',
          description: ratingChange > 0 
            ? 'Average event ratings are trending upward' 
            : 'Average event ratings are declining - quality may need attention',
          metric: `${recentAvgRating.toFixed(1)} vs ${olderAvgRating.toFixed(1)}`,
          change: parseFloat(ratingChange.toFixed(1)),
          icon: ratingChange > 0 ? 'trending_up' : 'trending_down'
        });
      }
    }

    // 2. Visitor growth trend
    const recentVisitors = recentEvents.reduce((sum, e) => sum + (e.visitor_count || 0), 0);
    const olderVisitors = olderEvents.reduce((sum, e) => sum + (e.visitor_count || 0), 0);
    
    if (olderVisitors > 0) {
      const visitorChange = ((recentVisitors - olderVisitors) / olderVisitors) * 100;
      if (Math.abs(visitorChange) > 10) {
        signals.push({
          type: visitorChange > 0 ? 'positive' : 'negative',
          title: visitorChange > 0 ? 'Visitor Growth' : 'Visitor Decline',
          description: visitorChange > 0 
            ? 'More visitors are attending events recently' 
            : 'Fewer visitors are attending recent events',
          metric: `${this.formatNumber(recentVisitors)} vs ${this.formatNumber(olderVisitors)}`,
          change: parseFloat(visitorChange.toFixed(1)),
          icon: visitorChange > 0 ? 'trending_up' : 'trending_down'
        });
      }
    }

    // 3. Engagement rate trend
    const recentEngagement = recentEvents.length > 0
      ? (recentEvents.reduce((sum, e) => sum + (e.review_count || 0), 0) / 
         recentEvents.reduce((sum, e) => sum + (e.view_count || 1), 0)) * 100
      : 0;
    const olderEngagement = olderEvents.length > 0
      ? (olderEvents.reduce((sum, e) => sum + (e.review_count || 0), 0) / 
         olderEvents.reduce((sum, e) => sum + (e.view_count || 1), 0)) * 100
      : 0;
    
    if (olderEngagement > 0) {
      const engagementChange = recentEngagement - olderEngagement;
      if (Math.abs(engagementChange) > 2) {
        signals.push({
          type: engagementChange > 0 ? 'positive' : 'negative',
          title: engagementChange > 0 ? 'Engagement Rising' : 'Engagement Falling',
          description: engagementChange > 0 
            ? 'Visitors are leaving more reviews on events' 
            : 'Visitors are less engaged with rating events',
          metric: `${recentEngagement.toFixed(1)}% vs ${olderEngagement.toFixed(1)}%`,
          change: parseFloat(engagementChange.toFixed(1)),
          icon: engagementChange > 0 ? 'star' : 'warning'
        });
      }
    }

    // 4. Find hot category (fastest growing)
    const categoryGrowth = categories.map(cat => {
      const catRecent = recentEvents.filter(e => e.category_id === cat.id);
      const catOlder = olderEvents.filter(e => e.category_id === cat.id);
      const growth = catOlder.length > 0 
        ? ((catRecent.length - catOlder.length) / catOlder.length) * 100 
        : catRecent.length > 0 ? 100 : 0;
      return { name: cat.name, growth, recentCount: catRecent.length };
    }).filter(c => c.recentCount > 0);

    const hotCategory = categoryGrowth.sort((a, b) => b.growth - a.growth)[0];
    const coldCategory = categoryGrowth.sort((a, b) => a.growth - b.growth)[0];

    if (hotCategory && hotCategory.growth > 20) {
      signals.push({
        type: 'positive',
        title: `${hotCategory.name} is Hot`,
        description: `This category is seeing rapid growth in event numbers`,
        metric: `${hotCategory.recentCount} recent events`,
        change: parseFloat(hotCategory.growth.toFixed(1)),
        icon: 'trending_up'
      });
    }

    if (coldCategory && coldCategory.growth < -20) {
      signals.push({
        type: 'negative',
        title: `${coldCategory.name} is Cooling`,
        description: `This category has fewer events recently`,
        metric: `${coldCategory.recentCount} recent events`,
        change: parseFloat(coldCategory.growth.toFixed(1)),
        icon: 'trending_down'
      });
    }

    // 5. Quality alert - high volume, low rating recent events
    const qualityAlerts = recentEvents.filter(e => 
      (e.visitor_count || 0) > 500 && (e.avg_rating || 0) < 3.5
    );
    
    if (qualityAlerts.length > 0) {
      signals.push({
        type: 'negative',
        title: 'Quality Alert',
        description: `${qualityAlerts.length} popular recent events have low ratings`,
        metric: `${qualityAlerts.length} events below 3.5★`,
        change: -qualityAlerts.length,
        icon: 'warning'
      });
    }

    // 6. Star performers - high rating with good visitors
    const starPerformers = recentEvents.filter(e => 
      (e.visitor_count || 0) > 500 && (e.avg_rating || 0) >= 4.5
    );
    
    if (starPerformers.length > 0) {
      signals.push({
        type: 'positive',
        title: 'Star Performers',
        description: `${starPerformers.length} recent events achieved excellence`,
        metric: `${starPerformers.length} events above 4.5★`,
        change: starPerformers.length,
        icon: 'star'
      });
    }

    this.trendSignals.set(signals);
  }

  calculateCategoryTrends(events: EventWithRelations[], categories: Category[]) {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

    const trends = categories.map(cat => {
      const recentEvents = events.filter(e => 
        e.category_id === cat.id && new Date(e.event_date) >= threeMonthsAgo
      );
      const olderEvents = events.filter(e => {
        const date = new Date(e.event_date);
        return e.category_id === cat.id && date < threeMonthsAgo && date >= sixMonthsAgo;
      });

      const recentAvgRating = recentEvents.length > 0
        ? recentEvents.reduce((sum, e) => sum + (e.avg_rating || 0), 0) / recentEvents.length
        : 0;
      const olderAvgRating = olderEvents.length > 0
        ? olderEvents.reduce((sum, e) => sum + (e.avg_rating || 0), 0) / olderEvents.length
        : 0;

      const ratingChange = olderAvgRating > 0 
        ? ((recentAvgRating - olderAvgRating) / olderAvgRating) * 100 
        : 0;
      const growthRate = olderEvents.length > 0 
        ? ((recentEvents.length - olderEvents.length) / olderEvents.length) * 100 
        : recentEvents.length > 0 ? 100 : 0;

      let momentum: 'rising' | 'falling' | 'stable' = 'stable';
      if (growthRate > 15 || ratingChange > 10) momentum = 'rising';
      if (growthRate < -15 || ratingChange < -10) momentum = 'falling';

      return {
        name: cat.name,
        color: cat.color,
        recentAvgRating: parseFloat(recentAvgRating.toFixed(1)),
        olderAvgRating: parseFloat(olderAvgRating.toFixed(1)),
        ratingChange: parseFloat(ratingChange.toFixed(1)),
        recentEvents: recentEvents.length,
        olderEvents: olderEvents.length,
        growthRate: parseFloat(growthRate.toFixed(1)),
        momentum
      };
    }).filter(t => t.recentEvents > 0 || t.olderEvents > 0);

    this.categoryTrends.set(trends.sort((a, b) => b.growthRate - a.growthRate));
  }

  calculateSeasonalPatterns(events: EventWithRelations[], categories: Category[]) {
    const seasonMap: Record<string, EventWithRelations[]> = {
      'Winter': [],
      'Spring': [],
      'Summer': [],
      'Fall': []
    };

    events.forEach(event => {
      const month = new Date(event.event_date).getMonth();
      if (month >= 11 || month <= 1) seasonMap['Winter'].push(event);
      else if (month >= 2 && month <= 4) seasonMap['Spring'].push(event);
      else if (month >= 5 && month <= 7) seasonMap['Summer'].push(event);
      else seasonMap['Fall'].push(event);
    });

    const patterns: SeasonalPattern[] = Object.entries(seasonMap).map(([season, seasonEvents]) => {
      const avgRating = seasonEvents.length > 0
        ? seasonEvents.reduce((sum, e) => sum + (e.avg_rating || 0), 0) / seasonEvents.length
        : 0;

      // Find best category for this season
      const categoryPerformance = categories.map(cat => {
        const catEvents = seasonEvents.filter(e => e.category_id === cat.id);
        return {
          name: cat.name,
          color: cat.color,
          count: catEvents.length,
          avgRating: catEvents.length > 0
            ? catEvents.reduce((sum, e) => sum + (e.avg_rating || 0), 0) / catEvents.length
            : 0
        };
      }).filter(c => c.count > 0);

      const bestCat = categoryPerformance.sort((a, b) => b.avgRating - a.avgRating)[0];

      return {
        season,
        eventCount: seasonEvents.length,
        avgRating: parseFloat(avgRating.toFixed(1)),
        bestCategory: bestCat?.name || 'N/A',
        bestCategoryColor: bestCat?.color || '#888'
      };
    });

    this.seasonalPatterns.set(patterns);
  }

  calculateBestWorstMonths(events: EventWithRelations[]) {
    const monthlyStats = this.monthlyData();
    if (monthlyStats.length === 0) return;

    // Best month: highest combination of events and rating
    const scored = monthlyStats.map(m => ({
      ...m,
      score: (m.eventCount * 10) + (m.avgRating * 20)
    }));

    const best = scored.sort((a, b) => b.score - a.score)[0];
    const worst = scored.sort((a, b) => a.score - b.score)[0];

    this.bestMonth.set({
      month: best.month,
      reason: `${best.eventCount} events with ${best.avgRating}★ avg`
    });

    this.worstMonth.set({
      month: worst.month,
      reason: `${worst.eventCount} events with ${worst.avgRating}★ avg`
    });
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

  protected readonly maxPopularityScore = computed(() => 
    Math.max(...this.topEvents().map(e => e.popularityScore), 1)
  );

  // Scatterplot data: visitors vs satisfaction
  protected readonly scatterData = computed(() => 
    this.allEvents()
      .filter(e => (e.visitor_count || 0) > 0 && (e.avg_rating || 0) > 0)
      .map(e => ({
        visitors: e.visitor_count || 0,
        rating: e.avg_rating || 0,
        title: e.title,
        category: e.category_id,
        color: e.color
      }))
  );

  protected readonly maxScatterVisitors = computed(() => 
    Math.max(...this.scatterData().map(d => d.visitors), 1)
  );

  // Map data: events with coordinates (using city centers as approximation)
  protected readonly mapEvents = computed(() => {
    const cityCoordinates: Record<string, {lat: number, lng: number}> = {
      'Brussels': { lat: 50.8503, lng: 4.3517 },
      'Antwerp': { lat: 51.2194, lng: 4.4025 },
      'Ghent': { lat: 51.0543, lng: 3.7174 },
      'Bruges': { lat: 51.2093, lng: 3.2247 },
      'Leuven': { lat: 50.8798, lng: 4.7005 },
      'Liège': { lat: 50.6326, lng: 5.5797 }
    };

    return this.allEvents()
      .filter(e => e.city?.name && e.avg_rating)
      .map(e => {
        const coords = cityCoordinates[e.city!.name] || { lat: 50.8503, lng: 4.3517 };
        return {
          ...e,
          lat: coords.lat,
          lng: coords.lng,
          cityName: e.city!.name
        };
      });
  });

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

  getDonutDashArrayByRating(rating: number): string {
    const percentage = (rating / 5) * 100;
    return `${percentage} ${100 - percentage}`;
  }

  getDonutOffsetByRating(index: number): number {
    const stats = this.categoryStats();
    let offset = 25;
    for (let i = 0; i < index; i++) {
      const percentage = (stats[i].avgRating / 5) * 100;
      offset -= percentage;
    }
    return offset;
  }

  getOverallAvgRating(): string {
    const stats = this.categoryStats();
    if (stats.length === 0) return '0.0';
    const total = stats.reduce((sum, c) => sum + c.avgRating, 0);
    return (total / stats.length).toFixed(1);
  }

  getSortedCityStats() {
    return [...this.cityStats()].map(city => ({
      ...city,
      activityScore: city.eventCount * 10 + city.totalVisitors + (city.avgRating * 100)
    })).sort((a, b) => b.activityScore - a.activityScore);
  }

  getMaxActivityScore(): number {
    const sorted = this.getSortedCityStats();
    return Math.max(...sorted.map(c => c.activityScore), 1);
  }

  getMapEventsByCity() {
    const cityMap = new Map<string, {cityName: string, lat: number, lng: number, avg_rating: number, count: number}>();
    
    this.mapEvents().forEach(event => {
      const key = event.cityName;
      if (!cityMap.has(key)) {
        cityMap.set(key, {
          cityName: event.cityName,
          lat: event.lat,
          lng: event.lng,
          avg_rating: 0,
          count: 0
        });
      }
      const cityData = cityMap.get(key)!;
      cityData.avg_rating = (cityData.avg_rating * cityData.count + (event.avg_rating || 0)) / (cityData.count + 1);
      cityData.count++;
    });
    
    return Array.from(cityMap.values());
  }

  getMapX(lng: number): number {
    // Belgium longitude range: ~2.5 to ~6.4
    // Map width: 300 (50 to 350)
    return 50 + ((lng - 2.5) / (6.4 - 2.5)) * 300;
  }

  getMapY(lat: number): number {
    // Belgium latitude range: ~49.5 to ~51.5
    // Map height: 200 (50 to 250)
    return 50 + ((51.5 - lat) / (51.5 - 49.5)) * 200;
  }

  getMarkerSize(rating: number): number {
    if (rating < 3) return 8;
    if (rating < 4) return 10;
    return 12;
  }

  getRatingColor(rating: number): string {
    if (rating < 3) return '#ff4444';
    if (rating < 4) return '#ffaa00';
    return '#44ff44';
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


