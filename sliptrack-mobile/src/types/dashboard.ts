export interface DashboardSummary {
  totalPaid: number;
  totalUnpaid: number;
  paidCount: number;
  unpaidCount: number;
}

export interface CategoryAmount {
  categoryId: number;
  categoryName: string;
  totalAmount: number;
  count: number;
}

export interface SubCategoryAmount {
  subCategoryId: number;
  subCategoryName: string;
  categoryId: number;
  categoryName: string;
  totalAmount: number;
  count: number;
}

export interface PropertySubCategoryAmount {
  propertyId: number;
  propertyName: string;
  subCategoryId: number;
  subCategoryName: string;
  totalAmount: number;
  count: number;
}

export interface ProviderAmount {
  providerName: string;
  totalAmount: number;
  count: number;
}

export interface TimelinePoint {
  period: string;
  totalAmount: number;
}
