# Sources & Documentation

This document tracks all sources, AI conversations, references, and development decisions for the Event Collection project.

## Table of Contents

1. [Technology Stack & Sources](#technology-stack--sources)
2. [Architecture Decisions](#architecture-decisions)
3. [External Resources](#external-resources)
4. [Development Timeline](#development-timeline)

---

## Technology Stack & Sources

### Frontend Framework
- **Angular** (v17+)
  - Official Documentation: https://angular.io/docs
  - Signals API: https://angular.io/guide/signals
  - Standalone Components: https://angular.io/guide/standalone-components

### Database & Backend
- **Supabase**
  - Official Documentation: https://supabase.com/docs
  - JavaScript Client: https://supabase.com/docs/reference/javascript/introduction
  - PostgreSQL: https://www.postgresql.org/docs/

### Containerization
- **Docker**
  - Official Documentation: https://docs.docker.com/
  - Docker Compose: https://docs.docker.com/compose/
  - Multi-stage Builds: https://docs.docker.com/build/building/multi-stage/

### Development Tools
- **Node.js**: https://nodejs.org/
- **npm**: https://www.npmjs.com/
- **TypeScript**: https://www.typescriptlang.org/

---

## Architecture Decisions

### 1. Direct Supabase Integration
**Decision**: Use Supabase directly from Angular frontend instead of a separate Node.js API layer.

**Rationale**:
- Simpler architecture (fewer moving parts)
- Reduced latency (direct database connection)
- Leverages Supabase's built-in security (RLS policies)
- Lower maintenance overhead

**Trade-offs**:
- Business logic must be in frontend or Supabase functions
- Less flexibility for complex server-side operations

### 2. Anonymous User Tracking
**Decision**: Use localStorage-based anonymous user IDs instead of requiring authentication.

**Rationale**:
- Lower barrier to entry for users
- Enables tracking without sign-up friction
- Can be upgraded to authenticated users later

**Implementation**:
- Anonymous IDs stored in localStorage
- Format: `anon-{randomString}`
- Upgradable to authenticated Supabase users

### 3. Signal-Based State Management
**Decision**: Use Angular Signals instead of RxJS Observables for reactive state.

**Rationale**:
- Modern Angular approach (v17+)
- Simpler syntax and better performance
- Better TypeScript integration
- Computed signals for derived state

### 4. Standalone Components
**Decision**: Use Angular standalone components instead of NgModules.

**Rationale**:
- Modern Angular best practice
- Better tree-shaking
- Simpler component structure
- Easier migration path

### 5. Docker Simplification
**Decision**: Remove local PostgreSQL and Node.js API, use only Angular container.

**Rationale**:
- User already has Supabase (PostgreSQL)
- Reduces complexity
- Faster startup time
- Fewer services to maintain

---

## External Resources

### AI Conversations
1. **ChatGPT Development Session**
   - URL: https://chatgpt.com/share/695b269e-ab1c-8008-9e84-aaa8e46e0c54
   - Used for: Development assistance and code generation

### Documentation References
1. **Angular Signals Guide**
   - URL: https://angular.io/guide/signals
   - Used for: Reactive state management

2. **Supabase JavaScript Client**
   - URL: https://supabase.com/docs/reference/javascript/introduction
   - Used for: Database operations, authentication

3. **Docker Multi-stage Builds**
   - URL: https://docs.docker.com/build/building/multi-stage/
   - Used for: Optimizing Docker image size

4. **Angular Routing**
   - URL: https://angular.io/guide/router
   - Used for: Navigation and route configuration

### Code Patterns & Best Practices
1. **Angular Standalone Components**
   - Pattern: Component-based architecture without NgModules
   - Source: Angular official documentation

2. **TypeScript Interfaces**
   - Pattern: Strong typing for all data structures
   - Source: TypeScript handbook

3. **CSS Custom Properties**
   - Pattern: CSS variables for theming
   - Source: MDN Web Docs

---

## Development Timeline

### Initial Setup
- Angular project initialization
- Supabase integration
- Basic routing structure

### Feature Development
1. **Home & Explore Pages**: Event listing and filtering
2. **Analytics Dashboard**: Data visualization and trend analysis
3. **User Tracking**: Interaction tracking directives
4. **Admin Dashboard**: Data management interface
5. **Event Detail Page**: Rating and check-in functionality
6. **Profile & Authentication**: User profile management

### Refactoring & Optimization
1. **Docker Simplification**: Removed redundant services
2. **Environment Configuration**: Centralized configuration
3. **Error Handling**: Improved error messages and validation

---

## Code Style & Conventions

### TypeScript
- Strict mode enabled
- Interfaces for all data structures
- Explicit return types for public methods
- Private methods for internal logic

### Angular
- Standalone components
- Signals for reactive state
- Computed signals for derived data
- Dependency injection for services

### CSS
- Standard CSS
- CSS custom properties for theming
- Mobile-first responsive design
- BEM-like naming conventions

### File Organization
```
src/app/
├── pages/          # Feature pages
├── services/       # Business logic
├── directives/     # Reusable directives
└── components/     # Shared components (if any)
```

---

## Dependencies

### Production Dependencies
- `@angular/core`: Angular framework
- `@angular/router`: Routing
- `@supabase/supabase-js`: Supabase client

### Development Dependencies
- `@angular/cli`: Angular CLI
- `typescript`: TypeScript compiler
- `@types/node`: Node.js type definitions

See `package.json` for complete list.

---

## Environment Variables

### Required Variables
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_KEY`: Supabase anon/public key

### Optional Variables
- `FRONTEND_PORT`: Port for Docker container (default: 4200)
- `NODE_ENV`: Environment mode (development/production)

See `env.example` for template.

---

## Database Schema

### Tables
- `cities`: Event locations
- `categories`: Event categories
- `events`: Event details
- `ratings`: User ratings and reviews
- `visits`: User check-ins
- `event_views`: Event view tracking
- `user_events`: Detailed interaction tracking
- `user_profiles`: User profile information

See Supabase dashboard for complete schema definition.

---

## Testing & Validation

### Data Validation
- Input sanitization in services
- Score validation (1-5 range)
- UUID format validation
- String trimming and HTML stripping

### Error Handling
- Try-catch blocks for async operations
- User-friendly error messages
- Graceful degradation for missing data

---

## Future Considerations

### Potential Enhancements
1. **Authentication**: Upgrade anonymous users to authenticated
2. **Real-time Updates**: Supabase Realtime subscriptions
3. **Advanced Analytics**: Machine learning insights
4. **Mobile App**: React Native or Ionic
5. **API Layer**: Add Node.js API if business logic grows

### Technical Debt
- `api.service.ts` still exists but is deprecated (using Supabase directly)
- Some components may benefit from further optimization
- Additional error handling and edge cases

---

## License

MIT License - See LICENSE file for details.

---

## Contact & Support

For issues, questions, or contributions:
- Check existing documentation (README.md, TRACKING_GUIDE.md)
- Review code comments and inline documentation
- Consult Supabase and Angular official documentation

---

**Last Updated**: 2025-01-05
**Documentation Version**: 1.0

