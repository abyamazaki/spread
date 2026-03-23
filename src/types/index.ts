export interface Company {
  id: string;
  name: string;
  region: string;
  contactPoint: string;
  owner: string;
  email: string;
  phone: string;
  notes: string;
  createdAt: any;
}

export interface Branch {
  id: string;
  companyId: string;
  companyName: string;
  name: string;
  address: string;
  phone: string;
  devices: number;
  owner: string;
  product: string;
  salesType: 'グループ内' | '外販' | '';
  initialCost: number;
  monthlyCost: number;
  startMonth: string;
  endMonth?: string;
  notes: string;
}

export interface Deal {
  id: string;
  customerId: string; // companyId
  customerName: string;
  product: string;
  status: '新規' | '接触済' | '商談中' | '成約' | '失注';
  date: string;
  activity: string;
  nextAction: string;
  owner: string;
  salesType?: string;
  initialCost?: number;
  monthlyCost?: number;
  createdAt: any;
}

export interface Agent {
  id: string;
  name: string;
  region: string;
  contactPoint: string;
  owner: string;
  email: string;
  phone: string;
  notes: string;
}

export interface AgentCustomer {
  id: string;
  agentId: string;
  agentName: string;
  name: string;
  product: string;
  salesType: string;
  initialCost: number;
  monthlyCost: number;
  startMonth: string;
  endMonth?: string;
  notes: string;
}

export interface MasterData {
  contacts: string[];
  owners: string[];
  regions: string[];
  products: { name: string; color: string }[];
  actions: string[];
}
