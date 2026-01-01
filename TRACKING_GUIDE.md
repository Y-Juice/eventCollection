# User Event Tracking System

This application includes a comprehensive user event tracking system that collects data on a user level for analytics and user profiling.

## Features

- **Automatic UID Assignment**: Each user gets a unique identifier (UID)
  - Authenticated users: Uses Supabase auth user ID
  - Anonymous users: Generates and stores anonymous UID in localStorage
- **Comprehensive Event Collection**: Tracks clicks, hovers, navigation, scrolls, file uploads, and more
- **Persistent Storage**: All events are stored in Supabase database
- **Batch Processing**: Events are batched and flushed efficiently
- **File Metadata Extraction**: Automatically extracts metadata from uploaded files (images, videos, audio)

## Database Setup

Before using the tracking system, you need to create the `user_events` table in your Supabase database. Run the SQL script in `database_schema.sql`:

```sql
-- See database_schema.sql for the complete schema
```

The table includes:
- User identification (user_id, session_id)
- Event details (event_type, event_category, element information)
- Context (page_url, route_path, viewport dimensions, scroll position)
- Timestamps and metadata
- File metadata for uploads

## Automatic Tracking

### Directives

The tracking system includes Angular directives that automatically track interactions:

#### `appTrackInteraction`
Tracks clicks and hovers on any element:

```html
<button appTrackInteraction>Click me</button>
<div appTrackInteraction>Hover over me</div>
```

#### `appTrackScroll`
Tracks scroll events on a container:

```html
<div appTrackScroll>
  <!-- Scrollable content -->
</div>
```

#### `appTrackFileUpload`
Automatically tracks file uploads and extracts metadata:

```html
<input type="file" appTrackFileUpload />
```

## Programmatic Tracking

You can also track events programmatically using the `UserTrackingService`:

### Basic Usage

```typescript
import { UserTrackingService } from './services/user-tracking.service';

export class MyComponent {
  private trackingService = inject(UserTrackingService);

  async handleAction() {
    await this.trackingService.trackEvent({
      event_type: 'button_click',
      event_category: 'interaction',
      element_type: 'button',
      element_id: 'submit_button',
      metadata: {
        action: 'submit_form',
        form_id: 'contact_form'
      }
    });
  }
}
```

### Track Clicks

```typescript
async onClick(event: MouseEvent, element: HTMLElement) {
  await this.trackingService.trackClick(element, event);
}
```

### Track Hovers

```typescript
async onHover(event: MouseEvent, element: HTMLElement, duration: number) {
  await this.trackingService.trackHover(element, event, duration);
}
```

### Track Scroll

```typescript
async onScroll() {
  await this.trackingService.trackScroll();
}
```

### Track File Uploads

```typescript
async onFileSelect(file: File) {
  await this.trackingService.trackFileUpload(file, {
    upload_context: 'profile_picture',
    user_action: 'update_avatar'
  });
}
```

## Event Types

The system tracks various event types:

- **click**: User clicks on an element
- **hover**: User hovers over an element (with duration)
- **scroll**: User scrolls the page
- **navigation**: User navigates to a new route
- **page_view**: User views a page
- **file_upload**: User uploads a file
- **visibility_change**: Page visibility changes (tab switch)
- **filter_change**: User changes filters/selections
- **event_click**: User clicks on an event card (custom)

## Event Categories

Events are categorized for easier analysis:

- **interaction**: User interactions (clicks, hovers)
- **navigation**: Navigation events
- **content**: Content-related events
- **file**: File operations
- **system**: System-level events

## Data Collected

For each event, the system collects:

- **User Information**: user_id, session_id
- **Event Details**: event_type, event_category, timestamp
- **Element Information**: element_type, element_id, element_class, element_text
- **Page Context**: page_url, page_title, route_path
- **Interaction Context**: x_coordinate, y_coordinate, viewport dimensions, scroll position
- **Custom Metadata**: Any additional data you provide
- **File Metadata** (for uploads): file_name, file_type, file_size, dimensions, duration, etc.

## Retrieving User Events

Use the `SupabaseService` to retrieve user events:

```typescript
import { SupabaseService } from './services/supabase.service';

export class AnalyticsComponent {
  private supabase = inject(SupabaseService);

  async loadUserEvents() {
    // Get all events for current user
    const events = await this.supabase.getUserEvents();

    // Get events with filters
    const filteredEvents = await this.supabase.getUserEvents(undefined, {
      eventType: 'click',
      eventCategory: 'interaction',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      limit: 100
    });

    // Get event statistics
    const stats = await this.supabase.getUserEventStats();
    console.log(stats);
    // {
    //   totalEvents: 1234,
    //   eventsByType: { click: 500, hover: 300, ... },
    //   eventsByCategory: { interaction: 800, ... },
    //   firstEventDate: '2024-01-01T00:00:00Z',
    //   lastEventDate: '2024-12-31T23:59:59Z',
    //   totalSessions: 45
    // }
  }
}
```

## Batch Processing

Events are automatically batched and flushed:
- **Batch Size**: 50 events (configurable)
- **Flush Interval**: 5 seconds (configurable)
- **Automatic Flush**: On page unload, all pending events are flushed

You can manually flush events:

```typescript
await this.trackingService.flush();
```

## User ID Management

The system automatically manages user IDs:

1. **Authenticated Users**: Uses Supabase auth user ID
2. **Anonymous Users**: 
   - Generates anonymous UID: `anon_<timestamp>_<random>`
   - Stores in localStorage for persistence
   - Same UID is reused across sessions

Get the current user ID:

```typescript
const userId = this.trackingService.getUserId();
const sessionId = this.trackingService.getSessionId();
```

## File Metadata Extraction

When files are uploaded, the system automatically extracts:

- **Images**: Width, height, dimensions
- **Videos**: Width, height, duration, codec (if available)
- **Audio**: Duration
- **All Files**: Name, type, size, MIME type, last modified date

## Best Practices

1. **Use Directives for Common Interactions**: Use `appTrackInteraction` for buttons, links, and interactive elements
2. **Track Custom Events**: Use `trackEvent()` for business-specific events (form submissions, purchases, etc.)
3. **Include Relevant Metadata**: Add context in the `metadata` field for better analytics
4. **Don't Over-Track**: Avoid tracking every single mouse movement; focus on meaningful interactions
5. **Respect Privacy**: Be transparent about data collection and comply with privacy regulations

## Example: Complete Tracking Setup

```typescript
// Component
export class EventDetailComponent implements OnInit {
  private trackingService = inject(UserTrackingService);
  private supabase = inject(SupabaseService);

  async ngOnInit() {
    // Track page view
    await this.trackingService.trackEvent({
      event_type: 'page_view',
      event_category: 'navigation',
      route_path: '/event/123',
      metadata: { event_id: '123' }
    });
  }

  async onEventAction(action: string) {
    await this.trackingService.trackEvent({
      event_type: 'event_action',
      event_category: 'content',
      metadata: {
        action: action,
        event_id: '123',
        timestamp: new Date().toISOString()
      }
    });
  }
}
```

```html
<!-- Template -->
<div appTrackScroll>
  <button appTrackInteraction (click)="onEventAction('like')">
    Like Event
  </button>
  
  <input type="file" appTrackFileUpload accept="image/*" />
</div>
```

## Troubleshooting

### Events Not Being Saved

1. Check that the `user_events` table exists in Supabase
2. Verify Supabase credentials in environment files
3. Check browser console for errors
4. Ensure user ID is being generated/retrieved correctly

### Too Many Events

- Increase the batch size or flush interval
- Filter events before tracking
- Use throttling for scroll events (already implemented)

### Missing File Metadata

- Some file types may not support metadata extraction
- Check browser console for warnings
- Metadata extraction is asynchronous and may fail silently

## Privacy Considerations

- All tracking is done client-side
- User IDs are either from authentication or anonymous
- No personally identifiable information is collected by default
- Consider implementing opt-out mechanisms
- Comply with GDPR, CCPA, and other privacy regulations

