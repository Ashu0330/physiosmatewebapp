export interface PushSubscriptionDto {
  endpoint: string;
  p256DH: string;
  auth: string;
}

export interface PushUnsubscribeDto {
  endpoint: string;
}
