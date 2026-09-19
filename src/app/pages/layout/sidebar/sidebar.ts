import { Component, OnInit, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
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
export class Sidebar extends BaseComponent implements OnInit {
  @Input() activeTab: string = '';
  @Output() tabChange = new EventEmitter<string>();
  menulist: MenusModel[] = [];

  private sanitizer = inject(DomSanitizer);

  async ngOnInit(): Promise<void> {
    await this.GetAllMenu();
  }

  async GetAllMenu(): Promise<void> {
    const res = await this.apiService.Get<MenusModel[]>(ApiEndPoints.GetAllMenu);
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

  isActive(item: MenusModel): boolean {
    if (!this.activeTab) return false;
    const current = this.activeTab.toLowerCase().trim();
    const path = (item.path || '').toLowerCase().trim();
    const name = (item.menuName || '').toLowerCase().trim();
    return current === path || current === name;
  }

  isSvg(icon?: string): boolean {
    return !!icon && icon.trim().startsWith('<');
  }

  getSafeIcon(icon?: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(icon || '');
  }
}
