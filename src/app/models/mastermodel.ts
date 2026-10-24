export class mastermodel {
  id: number;
  name: string;
}
export class MenusModel {
  menuId: number;
  menuName: string;
  icon: string;
  path: string;
}

export class roles {
  id: number = 0;
  roleName: string = '';
  description: string = '';
  displayTitle: string = '';
  iconClass: string = '';
  iconName: string = '';
}

export class qualification {
  id: number = 0;
  qualificationName: string = '';
}

export class language {
  id: number = 0;
  name: string = '';
}

export class specialization {
  id: number = 0;
  name: string = '';
  isActive: boolean = false;
  icon: string = '';
}

export class ServiceItem {
  id: number = 0;
  serviceName: string = '';
}

export class PlanBenefit {
  id: number;
  planId: number;
  type: number;
  benefitName: string;
  isSystem: boolean;
}

export class ProviderPlan {
  id: number;
  planName: string;
  totalSessions: number;
  validityDays: number;
  price: number;
  isPopular: boolean;
  isActive: boolean;
  providerType: string;
  providerId: number;
  expertiseId: number | null;
  benefits: PlanBenefit[];
}

export class ProviderAddon {
  id: number;
  providerType: string;
  providerId: number;
  addOnName: string;
  price: number;
  createdAt: string;
}
