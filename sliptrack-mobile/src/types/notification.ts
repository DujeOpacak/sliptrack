export interface Notification {
  id: number;
  message: string;
  read: boolean;
  paymentSlipId: number | null;
  sentAt: string;
}
