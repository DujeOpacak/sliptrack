export interface Category {
  id: number;
  name: string;
  createdAt: string;
}

export interface CategoryRequest {
  name: string;
}

export interface SubCategory {
  id: number;
  name: string;
  allowsProperty: boolean;
  categoryId: number;
  categoryName: string;
  createdAt: string;
}

export interface SubCategoryRequest {
  name: string;
  allowsProperty: boolean;
  categoryId: number;
}
