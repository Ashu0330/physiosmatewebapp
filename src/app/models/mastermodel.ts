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