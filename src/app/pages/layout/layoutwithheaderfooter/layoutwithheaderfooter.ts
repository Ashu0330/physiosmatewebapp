import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterModule } from "@angular/router";
import { SharedModule } from '../../../shared/shared-module';
import { RegisteredComponent } from '../../../helper/registerComponent';


@Component({
  selector: 'app-layoutwithheaderfooter',
  imports: [SharedModule, RegisteredComponent],
  templateUrl: './layoutwithheaderfooter.html',
  styleUrl: './layoutwithheaderfooter.css',
})
export class Layoutwithheaderfooter {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  toggleSidebar(): void {
    if (isPlatformBrowser(this.platformId)) {
      document.body.classList.toggle('sidebar-open');
    }
  }

  closeMobileSidebar(): void {
    if (isPlatformBrowser(this.platformId)) {
      document.body.classList.remove('sidebar-open');
    }
  }
}
