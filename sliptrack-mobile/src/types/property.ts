export interface Property {
  id: number;
  name: string;
  address: string | null;
  createdAt: string;
}

export interface PropertyRequest {
  name: string;
  address?: string;
}
