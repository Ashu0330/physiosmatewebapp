import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PushNotificationService } from '../../../services/push-notification.service';

@Component({
  selector: 'app-notification-toggle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-toggle.component.html',
  styleUrls: ['./notification-toggle.component.css']
})
export class NotificationToggleComponent implements OnInit {
  private readonly pushService = inject(PushNotificationService);

  isSupported = signal<boolean>(false);
  isSubscribed = signal<boolean>(false);
  permissionStatus = signal<string>('default');
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  async ngOnInit() {
    this.checkStatus();
  }

  async checkStatus() {
    this.isSupported.set(this.pushService.isSupported());
    if (this.isSupported()) {
      this.permissionStatus.set(this.pushService.getPermissionStatus());
      const subscribed = await this.pushService.isSubscribed();
      this.isSubscribed.set(subscribed);
    }
  }

  async toggleNotifications() {
    this.errorMessage.set(null);
    this.isLoading.set(true);

    try {
      if (this.isSubscribed()) {
        const result = await this.pushService.unsubscribe();
        if (result) {
          this.isSubscribed.set(false);
        }
      } else {
        await this.pushService.enableNotifications();
        this.isSubscribed.set(true);
        this.permissionStatus.set(this.pushService.getPermissionStatus());
      }
    } catch (err: any) {
      console.error('Notification toggle error:', err);
      this.errorMessage.set(err?.message || 'An error occurred while updating push notifications.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
