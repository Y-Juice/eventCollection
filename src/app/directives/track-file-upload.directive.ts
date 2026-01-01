import { Directive, ElementRef, OnInit, OnDestroy, inject, Renderer2 } from '@angular/core';
import { UserTrackingService } from '../services/user-tracking.service';

@Directive({
  selector: 'input[type="file"][appTrackFileUpload]',
  standalone: true
})
export class TrackFileUploadDirective implements OnInit, OnDestroy {
  private elementRef = inject(ElementRef<HTMLInputElement>);
  private trackingService = inject(UserTrackingService);
  private renderer = inject(Renderer2);
  private changeListener?: () => void;

  ngOnInit() {
    const element = this.elementRef.nativeElement;

    this.changeListener = this.renderer.listen(element, 'change', (event: Event) => {
      const input = event.target as HTMLInputElement;
      if (input.files && input.files.length > 0) {
        for (let i = 0; i < input.files.length; i++) {
          const file = input.files[i];
          // Track asynchronously without blocking
          this.trackingService.trackFileUpload(file, {
            input_id: element.id || undefined,
            input_name: element.name || undefined,
            file_index: i,
            total_files: input.files.length
          }).catch(err => {
            console.warn('Error tracking file upload:', err);
          });
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.changeListener) {
      this.changeListener();
    }
  }
}

