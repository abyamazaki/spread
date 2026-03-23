export type Role = 'superuser' | 'admin' | 'user';

export interface AppUser {
  uid: string;
  email: string;
  tenantId: string | null;
  role: Role;
  name: string;
}

export interface Tenant {
  id: string;
  name: string;
  createdAt: any;
}
