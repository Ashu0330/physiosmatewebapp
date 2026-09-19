import { Component, OnInit, Input, Output, EventEmitter, SimpleChanges, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseComponent } from '../../../helper/base-component';
import { ApiEndPoints } from '../../../helper/api-endpoints';
import { MenusModel } from '../../../models/mastermodel';


@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar extends BaseComponent implements OnInit, OnChanges {
  @Input() activeTab: string = '';
  @Output() tabChange = new EventEmitter<string>();
  @Input() menulist: MenusModel[] = [];
  @Input() parentMenuId: number | null = null;

  async ngOnInit(): Promise<void> {
    if (!this.menulist || this.menulist.length === 0) {
      await this.GetAllMenu();
    }
  }


  async ngOnChanges(changes: SimpleChanges): Promise<void> {

    if (changes['parentMenuId'] && !changes['parentMenuId'].firstChange) {
      await this.GetAllMenu();
    }
  }

  async GetAllMenu(): Promise<void> {
    const parentId = this.parentMenuId ?? '';
    const res = await this.apiService.Get<MenusModel[]>(`${ApiEndPoints.GetAllMenu}?Type=Sidebar&parentMenuId=${parentId}`);
    this.menulist = res.isSuccess ? (res.data ?? []) : [];
  }

  selectTab(itemOrTab: MenusModel | string): void {
    if (typeof itemOrTab === 'string') {
      this.activeTab = itemOrTab;
      this.tabChange.emit(itemOrTab);
      return;
    }
    const tab = itemOrTab.path || itemOrTab.menuName;
    this.activeTab = tab;
    this.tabChange.emit(tab);
    if (itemOrTab.path && itemOrTab.path.startsWith('/')) {
      this.router.navigateByUrl(itemOrTab.path);
    }
  }


  isSidebarActive(): boolean {
    return this.menulist.some(menu =>
      this.router.isActive(menu.path, {
        paths: 'exact',
        queryParams: 'ignored',
        matrixParams: 'ignored',
        fragment: 'ignored'
      })
    );
  }
}
