import { Directive, ElementRef, OnInit, OnDestroy, inject, Renderer2 } from '@angular/core';
import { UserTrackingService } from '../services/user-tracking.service';

@Directive({
  selector: '[appTrackInteraction]',
  standalone: true
})
export class TrackInteractionDirective implements OnInit, OnDestroy {
  private elementRef = inject(ElementRef<HTMLElement>);
  private trackingService = inject(UserTrackingService);
  private renderer = inject(Renderer2);
  private clickListener?: () => void;
  private mouseEnterListener?: () => void;
  private mouseLeaveListener?: () => void;
  private hoverStartTime?: number;
  private hoverTimer?: any;

  ngOnInit() {
    const element = this.elementRef.nativeElement;

    // Track clicks
    this.clickListener = this.renderer.listen(element, 'click', (event: MouseEvent) => {
      this.trackingService.trackClick(element, event).catch(err => {
        console.warn('Error tracking click:', err);
      });
    });

    // Track hovers with duration
    this.mouseEnterListener = this.renderer.listen(element, 'mouseenter', (event: MouseEvent) => {
      this.hoverStartTime = Date.now();
      this.trackingService.trackHover(element, event, 0).catch(err => {
        console.warn('Error tracking hover start:', err);
      });
    });

    this.mouseLeaveListener = this.renderer.listen(element, 'mouseleave', (event: MouseEvent) => {
      const duration = this.hoverStartTime ? Date.now() - this.hoverStartTime : 0;
      this.trackingService.trackHover(element, event, duration).catch(err => {
        console.warn('Error tracking hover end:', err);
      });
      this.hoverStartTime = undefined;
    });
  }

  ngOnDestroy() {
    if (this.clickListener) {
      this.clickListener();
    }
    if (this.mouseEnterListener) {
      this.mouseEnterListener();
    }
    if (this.mouseLeaveListener) {
      this.mouseLeaveListener();
    }
    if (this.hoverTimer) {
      clearTimeout(this.hoverTimer);
    }
  }
}

