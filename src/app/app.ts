import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { TrackInteractionDirective } from './directives/track-interaction.directive';
import { TrackScrollDirective } from './directives/track-scroll.directive';
import { UserTrackingService } from './services/user-tracking.service';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TrackInteractionDirective,
    TrackScrollDirective
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private trackingService = inject(UserTrackingService);

  ngOnInit() {
    // Initialize tracking service (it auto-initializes, but this ensures it's ready)
    // The service will automatically start tracking once injected
  }
}
