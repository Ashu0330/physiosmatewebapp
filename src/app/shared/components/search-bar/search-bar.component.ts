import { Component, ElementRef, HostListener, ViewEncapsulation, input, model, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class SearchBarComponent {
  /** Two-way bindable selected city */
  readonly selectedCity = model<string>('Mumbai');

  /** Two-way bindable search input query */
  readonly searchQuery = model<string>('');

  /** Input placeholder text */
  readonly placeholder = input<string>('Search doctors, clinics, hospitals, etc.');

  /** City list options */
  readonly cities = input<string[]>([
    'Mumbai',
    'Delhi NCR',
    'Bangalore',
    'Hyderabad',
    'Pune',
    'Chennai',
    'Kolkata'
  ]);

  /** Optional additional CSS class for the wrapper */
  readonly customClass = input<string>('');

  /** Emitted when a city is chosen */
  readonly citySelect = output<string>();

  /** Emitted when Enter key is pressed in search field */
  readonly searchSubmit = output<{ query: string; city: string }>();

  /** Internal dropdown visibility state */
  readonly isCityOpen = signal<boolean>(false);

  constructor(private readonly elementRef: ElementRef<HTMLElement>) {}

  toggleCity(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.isCityOpen.update(open => !open);
  }

  selectCity(city: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.selectedCity.set(city);
    this.isCityOpen.set(false);
    this.citySelect.emit(city);
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
  }

  onSearchEnter(): void {
    this.searchSubmit.emit({
      query: this.searchQuery(),
      city: this.selectedCity()
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isCityOpen() && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.isCityOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isCityOpen()) {
      this.isCityOpen.set(false);
    }
  }
}
