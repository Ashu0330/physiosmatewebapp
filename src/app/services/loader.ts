import { Injectable, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Loader {
  private activeRequests = 0;
  readonly isLoading = signal<boolean>(false);
  readonly isLoading$ = new BehaviorSubject<boolean>(false);

  constructor() { }

  startLoader() {
    this.activeRequests++;
    this.isLoading.set(true);
    this.isLoading$.next(true);
  }

  stopLoader() {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
    if (this.activeRequests === 0) {
      this.isLoading.set(false);
      this.isLoading$.next(false);
    }
  }

  forceStopLoader() {
    this.activeRequests = 0;
    this.isLoading.set(false);
    this.isLoading$.next(false);
  }
}

