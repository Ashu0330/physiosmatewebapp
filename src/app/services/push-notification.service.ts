import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../environment/environment';
import { PushSubscriptionDto, PushUnsubscribeDto } from '../models/push-subscription.model';

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly http = inject(HttpClient);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  isSupported(): boolean {
    if (!this.isBrowser) {
      return false;
    }
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  getPermissionStatus(): NotificationPermission | 'unsupported' {
    if (!this.isSupported()) {
      return 'unsupported';
    }
    return Notification.permission;
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported by this browser.');
    }
    return await Notification.requestPermission();
  }

  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.isSupported()) {
      return null;
    }
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  }

  async isSubscribed(): Promise<boolean> {
    const subscription = await this.getSubscription();
    return subscription !== null;
  }

  async subscribe(): Promise<PushSubscription | null> {
    if (!this.isSupported()) {
      return null;
    }

    const permission = await this.requestPermission();

    if (permission !== 'granted') {
      return null;
    }

    const registration = await navigator.serviceWorker.ready;

    const existingSubscription =
      await registration.pushManager.getSubscription();

    // TEMPORARY: Remove old subscription
    if (existingSubscription) {
      await existingSubscription.unsubscribe();
    }

    // Create fresh subscription
    const subscription =
      await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey:
          this.urlBase64ToUint8Array(
            environment.vapidPublicKey
          ) as unknown as BufferSource
      });

    return subscription;
  }

  async enableNotifications(): Promise<void> {
    const subscription = await this.subscribe();
    if (!subscription) {
      throw new Error('Failed to obtain push subscription.');
    }

    const json = subscription.toJSON();
    const keys = json.keys;
    if (!json.endpoint || !keys || !keys['p256dh'] || !keys['auth']) {
      throw new Error('Invalid push subscription format received from browser.');
    }

    const payload: PushSubscriptionDto = {
      endpoint: json.endpoint,
      p256DH: keys['p256dh'],
      auth: keys['auth']
    };

    await firstValueFrom(
      this.http.post(`${environment.baseUrl}Push/Subscribe`, payload)
    );
  }

  async unsubscribe(): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }

    const subscription = await this.getSubscription();
    if (!subscription) {
      return true;
    }

    const endpoint = subscription.endpoint;
    const unsubscribed = await subscription.unsubscribe();

    if (unsubscribed) {
      try {
        const payload: PushUnsubscribeDto = { endpoint };
        await firstValueFrom(
          this.http.post(`${environment.baseUrl}Push/Unsubscribe`, payload)
        );
      } catch (err) {
        console.error('Failed to notify backend of push unsubscription:', err);
      }
    }

    return unsubscribed;
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}
