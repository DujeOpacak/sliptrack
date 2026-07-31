export type PaymentStatus = "PAID" | "UNPAID";

export interface PaymentSlip {
  id: number;
  iban: string;
  amount: number;
  referenceNumber: string | null;
  paymentModel: string | null;
  providerName: string | null;
  description: string | null;
  dueDate: string;
  status: PaymentStatus;
  paidAt: string | null;
  imageUrl: string | null;
  categoryId: number | null;
  categoryName: string | null;
  subCategoryId: number | null;
  subCategoryName: string | null;
  propertyId: number | null;
  propertyName: string | null;
  scannedAt: string | null;
  createdAt: string;
}

export interface PaymentSlipFilters {
  status?: PaymentStatus;
  categoryId?: number;
  subCategoryId?: number;
  propertyId?: number;
  dueDateFrom?: string;
  dueDateTo?: string;
}

export interface PaymentSlipRequest {
  iban: string;
  amount: number;
  referenceNumber?: string;
  paymentModel?: string;
  providerName?: string;
  description?: string;
  dueDate: string;
  categoryId: number;
  subCategoryId?: number;
  propertyId?: number;
  wasScanned?: boolean;
}
