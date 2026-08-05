import type { Role } from "./auth";

export interface AdminUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalPaymentSlips: number;
  topCategories: AdminCategoryCount[];
}

export interface AdminCategoryCount {
  categoryId: number;
  categoryName: string;
  count: number;
}

export interface AdminSubCategoryCount {
  subCategoryId: number;
  subCategoryName: string;
  categoryId: number;
  count: number;
}
