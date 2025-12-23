import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

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

interface City {
  name: string;
  eventCount: number;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  // Cities in Belgium
  protected readonly cities = signal<City[]>([
    { name: 'Brussels', eventCount: 47 },
    { name: 'Antwerp', eventCount: 35 },
    { name: 'Ghent', eventCount: 28 },
    { name: 'Bruges', eventCount: 22 },
    { name: 'Leuven', eventCount: 19 },
    { name: 'Liège', eventCount: 16 }
  ]);

  protected readonly selectedCity = signal<string>('Brussels');

  // Categories
  protected readonly categories = signal<Category[]>([
    { id: 'all', name: 'All', color: '#7B68C8' },
    { id: 'music', name: 'Music', color: '#FF6B5B' },
    { id: 'food', name: 'Food', color: '#FFD93D' },
    { id: 'culture', name: 'Culture', color: '#9B7EDE' },
    { id: 'sports', name: 'Sports', color: '#6BCAB3' },
    { id: 'art', name: 'Art', color: '#FFB5C5' }
  ]);

  protected readonly selectedCategory = signal<string>('all');

  // All events database
  protected readonly allEvents = signal<Event[]>([
    // Brussels Events
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
    // Antwerp Events
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
    // Ghent Events
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
    // Bruges Events
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
    // Leuven Events
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
    // Liège Events
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

  // Filtered events based on selected city and category
  protected readonly filteredEvents = computed(() => {
    const city = this.selectedCity();
    const category = this.selectedCategory();
    
    return this.allEvents().filter(event => {
      const cityMatch = event.city === city;
      const categoryMatch = category === 'all' || event.category === category;
      return cityMatch && categoryMatch;
    });
  });

  // City stats
  protected readonly cityStats = computed(() => {
    const city = this.selectedCity();
    const cityEvents = this.allEvents().filter(e => e.city === city);
    
    const totalVisitors = cityEvents.reduce((sum, e) => sum + e.visitorCount, 0);
    const avgRating = cityEvents.length > 0 
      ? cityEvents.reduce((sum, e) => sum + e.rating, 0) / cityEvents.length 
      : 0;
    
    return {
      eventCount: cityEvents.length,
      totalVisitors,
      avgRating: avgRating.toFixed(1)
    };
  });

  // Featured event for selected city
  protected readonly featuredEvent = computed(() => {
    const cityEvents = this.allEvents().filter(e => e.city === this.selectedCity());
    if (cityEvents.length === 0) return null;
    
    // Return highest rated event
    return cityEvents.reduce((best, current) => 
      current.rating > best.rating ? current : best
    );
  });

  selectCity(cityName: string): void {
    this.selectedCity.set(cityName);
  }

  selectCategory(categoryId: string): void {
    this.selectedCategory.set(categoryId);
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
