# Event Collection

A full-stack Angular application for tracking events, user interactions, and gathering analytics data. Uses Supabase (PostgreSQL) as the persistent database.

## Documentation

- **[SOURCES.md](SOURCES.md)**: Complete documentation of sources, AI conversations, architecture decisions, and development timeline
- **[TRACKING_GUIDE.md](TRACKING_GUIDE.md)**: User tracking implementation guide

## Features

- **Persistent Database**: Supabase (PostgreSQL) for data storage
- **Docker Environment**: Containerized frontend for consistent development
- **Data Validation**: Input sanitization and validation before database storage
- **Data Visualization**: Analytics dashboard with trends, charts, and insights
- **User-Level Tracking**: Distinguished users with unique IDs (UID) for personalized experiences
- **Data-Driven UI**: User data influences event recommendations and display

## Quick Start with Docker

### Prerequisites

- [Docker](https://www.docker.com/get-started) installed and running

### Running the Application

1. **Create environment file**

   ```bash
   cp env.example .env
   ```

2. **Start the application**

   ```bash
   docker compose up --build
   ```

3. **Access the application**

   Open [http://localhost:4200](http://localhost:4200)

### Stopping the Application

```bash
docker compose down
```

## Project Structure

```
eventCollection/
├── src/
│   ├── app/
│   │   ├── pages/          # Page components
│   │   │   ├── home/       # Home page with events
│   │   │   ├── explore/    # Event exploration
│   │   │   ├── ratings/    # User ratings
│   │   │   ├── analytics/  # Data visualization
│   │   │   ├── admin/      # Admin dashboard
│   │   │   └── event-detail/  # Event detail view
│   │   ├── services/       # API and tracking services
│   │   └── directives/     # Tracking directives
│   └── environments/       # Environment configuration
├── docker-compose.yml      # Docker configuration
├── Dockerfile              # Frontend container
├── env.example             # Environment template
└── package.json
```

## Database (Supabase/PostgreSQL)

### Tables

| Table | Description |
|-------|-------------|
| `cities` | Event locations (Brussels, Antwerp, Ghent, etc.) |
| `categories` | Event categories (Music, Food, Culture, Sports, Art, Tech) |
| `events` | Event details with date, time, and location |
| `ratings` | User ratings with scores (1-5) and reviews |
| `visits` | User check-ins to events |
| `event_views` | Tracks which users viewed which events |
| `user_events` | Detailed user interaction tracking |
| `user_profiles` | User profile information |

### Data Validation

All data is validated before storage:

- String inputs are trimmed
- Scores validated to be integers between 1-5
- UUIDs validated for proper format
- Numeric fields (coordinates, dimensions) are rounded to integers

## User Tracking

Each user is assigned a unique anonymous ID stored in localStorage. This enables:

- Personalized event recommendations
- Rating and attendance history
- Behavioral analytics
- Session tracking

Data collected includes:
- Page views and navigation
- Click interactions
- Scroll behavior
- Event ratings and check-ins

## Analytics & Visualization

The Analytics page provides:

- **Trend Signals**: Emerging, rising, and declining categories
- **Category Momentum**: Performance by event category
- **Seasonal Patterns**: Monthly event distribution
- **Best/Worst Months**: Peak and low activity periods
- **Rating Distributions**: User satisfaction metrics

## Development (without Docker)

```bash
npm install
npm start
```

Open [http://localhost:4200](http://localhost:4200)

## Requirements Checklist

| Requirement | Implementation |
|-------------|----------------|
| Persistent database | ✅ Supabase (PostgreSQL) |
| Docker environment | ✅ Containerized frontend |
| Single command startup | ✅ `docker compose up --build` |
| Data validation | ✅ Input sanitization in services |
| Data visualization | ✅ Analytics dashboard |
| User-level tracking (UID) | ✅ Anonymous user IDs |
| Data influences UI | ✅ Ratings, visitors, recommendations |

## License

MIT
