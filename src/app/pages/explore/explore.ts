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
  time: string;
  rating: number;
  reviewCount: number;
  visitorCount: number;
  color: string;
}

@Component({
  selector: 'app-explore',
  imports: [CommonModule, FormsModule],
  templateUrl: './explore.html',
  styleUrl: './explore.css'
})
export class Explore {
  protected readonly searchQuery = signal<string>('');
  protected readonly selectedCity = signal<string>('all');
  protected readonly selectedCategory = signal<string>('all');
  protected readonly sortBy = signal<'rating' | 'visitors' | 'reviews' | 'date'>('rating');
  protected readonly minRating = signal<number>(0);
  protected readonly showFilters = signal<boolean>(false);

  protected readonly cities = signal([
    { id: 'all', name: 'All Cities' },
    { id: 'Brussels', name: 'Brussels' },
    { id: 'Antwerp', name: 'Antwerp' },
    { id: 'Ghent', name: 'Ghent' },
    { id: 'Bruges', name: 'Bruges' },
    { id: 'Leuven', name: 'Leuven' },
    { id: 'Liège', name: 'Liège' }
  ]);

  protected readonly categories = signal([
    { id: 'all', name: 'All', color: '#7B68C8' },
    { id: 'music', name: 'Music', color: '#FF6B5B' },
    { id: 'food', name: 'Food', color: '#FFD93D' },
    { id: 'culture', name: 'Culture', color: '#9B7EDE' },
    { id: 'sports', name: 'Sports', color: '#6BCAB3' },
    { id: 'art', name: 'Art', color: '#FFB5C5' }
  ]);

  protected readonly sortOptions = signal<{id: 'rating' | 'visitors' | 'reviews' | 'date', name: string}[]>([
    { id: 'rating', name: 'Top Rated' },
    { id: 'visitors', name: 'Most Popular' },
    { id: 'reviews', name: 'Most Reviewed' },
    { id: 'date', name: 'Upcoming' }
  ]);

  // All events database
  protected readonly allEvents = signal<Event[]>([
    {
      id: 1,
      title: 'Jazz Nights',
      subtitle: 'Live at Flagey',
      category: 'music',
      city: 'Brussels',
      neighborhood: 'Ixelles',
      date: '2024-12-28',
      time: '20:00',
      rating: 4.8,
      reviewCount: 156,
      visitorCount: 420,
      color: '#FF6B5B'
    },
    {
      id: 2,
      title: 'Winter Market',
      subtitle: 'Grand Place',
      category: 'food',
      city: 'Brussels',
      neighborhood: 'City Center',
      date: '2024-12-20',
      time: '11:00',
      rating: 4.5,
      reviewCount: 312,
      visitorCount: 2800,
      color: '#FFD93D'
    },
    {
      id: 3,
      title: 'Magritte Expo',
      subtitle: 'Royal Museums',
      category: 'art',
      city: 'Brussels',
      neighborhood: 'Sablon',
      date: '2024-12-15',
      time: '10:00',
      rating: 4.9,
      reviewCount: 89,
      visitorCount: 650,
      color: '#FFB5C5'
    },
    {
      id: 4,
      title: 'Theatre Night',
      subtitle: 'La Monnaie',
      category: 'culture',
      city: 'Brussels',
      neighborhood: 'City Center',
      date: '2024-12-22',
      time: '19:30',
      rating: 4.7,
      reviewCount: 67,
      visitorCount: 380,
      color: '#9B7EDE'
    },
    {
      id: 5,
      title: 'RSC Anderlecht',
      subtitle: 'vs Club Brugge',
      category: 'sports',
      city: 'Brussels',
      neighborhood: 'Anderlecht',
      date: '2024-12-29',
      time: '18:00',
      rating: 4.3,
      reviewCount: 234,
      visitorCount: 18500,
      color: '#6BCAB3'
    },
    {
      id: 6,
      title: 'Techno Warehouse',
      subtitle: 'Fuse Club',
      category: 'music',
      city: 'Brussels',
      neighborhood: 'Marolles',
      date: '2024-12-31',
      time: '23:00',
      rating: 4.6,
      reviewCount: 198,
      visitorCount: 890,
      color: '#FF6B5B'
    },
    {
      id: 7,
      title: 'Diamond Gala',
      subtitle: 'MAS Museum',
      category: 'culture',
      city: 'Antwerp',
      neighborhood: 'Eilandje',
      date: '2024-12-27',
      time: '19:00',
      rating: 4.8,
      reviewCount: 78,
      visitorCount: 320,
      color: '#9B7EDE'
    },
    {
      id: 8,
      title: 'Street Food Fest',
      subtitle: 'Park Spoor Noord',
      category: 'food',
      city: 'Antwerp',
      neighborhood: 'Dam',
      date: '2024-12-21',
      time: '12:00',
      rating: 4.4,
      reviewCount: 256,
      visitorCount: 1850,
      color: '#FFD93D'
    },
    {
      id: 9,
      title: 'Rubens Exhibition',
      subtitle: 'Rubenshuis',
      category: 'art',
      city: 'Antwerp',
      neighborhood: 'Meir',
      date: '2024-12-18',
      time: '09:00',
      rating: 4.9,
      reviewCount: 145,
      visitorCount: 520,
      color: '#FFB5C5'
    },
    {
      id: 10,
      title: 'Antwerp Giants',
      subtitle: 'Basketball Night',
      category: 'sports',
      city: 'Antwerp',
      neighborhood: 'Merksem',
      date: '2024-12-26',
      time: '20:00',
      rating: 4.2,
      reviewCount: 89,
      visitorCount: 3200,
      color: '#6BCAB3'
    },
    {
      id: 11,
      title: 'Light Festival',
      subtitle: 'City Center',
      category: 'culture',
      city: 'Ghent',
      neighborhood: 'Korenmarkt',
      date: '2024-12-23',
      time: '18:00',
      rating: 4.9,
      reviewCount: 423,
      visitorCount: 5600,
      color: '#9B7EDE'
    },
    {
      id: 12,
      title: 'Veggie World',
      subtitle: 'Plant-based Festival',
      category: 'food',
      city: 'Ghent',
      neighborhood: 'Sint-Pieters',
      date: '2024-12-19',
      time: '11:00',
      rating: 4.6,
      reviewCount: 167,
      visitorCount: 980,
      color: '#FFD93D'
    },
    {
      id: 13,
      title: 'Indie Rock Night',
      subtitle: 'Vooruit Arts',
      category: 'music',
      city: 'Ghent',
      neighborhood: 'Sint-Pieters',
      date: '2024-12-30',
      time: '21:00',
      rating: 4.5,
      reviewCount: 112,
      visitorCount: 650,
      color: '#FF6B5B'
    },
    {
      id: 14,
      title: 'Canal Cruise',
      subtitle: 'Winter Edition',
      category: 'culture',
      city: 'Bruges',
      neighborhood: 'Historic Center',
      date: '2024-12-24',
      time: '14:00',
      rating: 4.7,
      reviewCount: 289,
      visitorCount: 450,
      color: '#9B7EDE'
    },
    {
      id: 15,
      title: 'Chocolate Tour',
      subtitle: 'Master Class',
      category: 'food',
      city: 'Bruges',
      neighborhood: 'Markt',
      date: '2024-12-22',
      time: '15:00',
      rating: 4.8,
      reviewCount: 134,
      visitorCount: 85,
      color: '#FFD93D'
    },
    {
      id: 16,
      title: 'Student Fest',
      subtitle: 'Oude Markt',
      category: 'music',
      city: 'Leuven',
      neighborhood: 'City Center',
      date: '2024-12-28',
      time: '22:00',
      rating: 4.3,
      reviewCount: 567,
      visitorCount: 3200,
      color: '#FF6B5B'
    },
    {
      id: 17,
      title: 'Beer Tasting',
      subtitle: 'Stella Artois',
      category: 'food',
      city: 'Leuven',
      neighborhood: 'Vaartkom',
      date: '2024-12-21',
      time: '17:00',
      rating: 4.6,
      reviewCount: 198,
      visitorCount: 280,
      color: '#FFD93D'
    },
    {
      id: 18,
      title: 'Village de Noël',
      subtitle: 'Christmas Market',
      category: 'food',
      city: 'Liège',
      neighborhood: 'Place Saint-Lambert',
      date: '2024-12-20',
      time: '10:00',
      rating: 4.5,
      reviewCount: 345,
      visitorCount: 4200,
      color: '#FFD93D'
    },
    {
      id: 19,
      title: 'Opera Night',
      subtitle: 'Opéra Royal',
      category: 'culture',
      city: 'Liège',
      neighborhood: 'City Center',
      date: '2024-12-25',
      time: '19:00',
      rating: 4.8,
      reviewCount: 56,
      visitorCount: 420,
      color: '#9B7EDE'
    }
  ]);

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
        event.subtitle.toLowerCase().includes(search) ||
        event.city.toLowerCase().includes(search) ||
        event.neighborhood.toLowerCase().includes(search);
      
      const cityMatch = city === 'all' || event.city === city;
      const categoryMatch = category === 'all' || event.category === category;
      const ratingMatch = event.rating >= minRating;

      return searchMatch && cityMatch && categoryMatch && ratingMatch;
    });

    // Sort events
    switch (sort) {
      case 'rating':
        events = events.sort((a, b) => b.rating - a.rating);
        break;
      case 'visitors':
        events = events.sort((a, b) => b.visitorCount - a.visitorCount);
        break;
      case 'reviews':
        events = events.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case 'date':
        events = events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
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
}
