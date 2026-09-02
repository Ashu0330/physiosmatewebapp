import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-provider-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './provider-summary.component.html',
  styleUrl: './provider-summary.component.css'
})
export class ProviderSummaryComponent {
  @Input() provider: any = null;
  @Input() loading: boolean = false;
}
