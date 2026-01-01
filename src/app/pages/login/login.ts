import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { UserTrackingService } from '../../services/user-tracking.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private supabase = inject(SupabaseService);
  private trackingService = inject(UserTrackingService);
  private router = inject(Router);

  protected readonly email = signal<string>('');
  protected readonly password = signal<string>('');
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly isSignUp = signal<boolean>(false);
  protected readonly name = signal<string>('');

  async onSubmit() {
    this.error.set(null);
    this.loading.set(true);

    try {
      if (this.isSignUp()) {
        // Track signup attempt
        await this.trackingService.trackEvent({
          event_type: 'signup_attempt',
          event_category: 'authentication',
          metadata: {
            email: this.email(),
            has_name: !!this.name()
          }
        });

        await this.supabase.signUp(
          this.email(),
          this.password(),
          this.name() || undefined
        );

        // Track successful signup
        await this.trackingService.trackEvent({
          event_type: 'signup_success',
          event_category: 'authentication',
          metadata: {
            email: this.email()
          }
        });

        // Update tracking service with new authenticated user
        await this.trackingService.updateUserId();
      } else {
        // Track login attempt
        await this.trackingService.trackEvent({
          event_type: 'login_attempt',
          event_category: 'authentication',
          metadata: {
            email: this.email()
          }
        });

        await this.supabase.signIn(this.email(), this.password());

        // Track successful login
        await this.trackingService.trackEvent({
          event_type: 'login_success',
          event_category: 'authentication',
          metadata: {
            email: this.email()
          }
        });

        // Update tracking service with authenticated user
        await this.trackingService.updateUserId();
      }

      // Redirect to home or previous page
      this.router.navigate(['/']);
    } catch (error: any) {
      const errorMessage = error.message || 'An error occurred';
      this.error.set(errorMessage);

      // Track failed authentication
      await this.trackingService.trackEvent({
        event_type: this.isSignUp() ? 'signup_failed' : 'login_failed',
        event_category: 'authentication',
        metadata: {
          email: this.email(),
          error: errorMessage
        }
      });
    } finally {
      this.loading.set(false);
    }
  }

  toggleMode() {
    this.isSignUp.set(!this.isSignUp());
    this.error.set(null);
  }
}

