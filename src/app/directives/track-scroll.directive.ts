import { Directive, OnInit, OnDestroy, inject, Renderer2 } from '@angular/core';
import { UserTrackingService } from '../services/user-tracking.service';

@Directive({
  selector: '[appTrackScroll]',
  standalone: true
})
export class TrackScrollDirective implements OnInit, OnDestroy {
  private trackingService = inject(UserTrackingService);
  private renderer = inject(Renderer2);
  private scrollListener?: () => void;
  private scrollThrottleTimer?: any;
  private lastScrollTime = 0;
  private readonly throttleDelay = 1000; // Track scroll every 1 second

  ngOnInit() {
    this.scrollListener = this.renderer.listen('window', 'scroll', () => {
      const now = Date.now();
      if (now - this.lastScrollTime >= this.throttleDelay) {
        this.lastScrollTime = now;
        this.trackingService.trackScroll().catch(err => {
          console.warn('Error tracking scroll:', err);
        });
      }
    });
  }

  ngOnDestroy() {
    if (this.scrollListener) {
      this.scrollListener();
    }
    if (this.scrollThrottleTimer) {
      clearTimeout(this.scrollThrottleTimer);
    }
  }
}

