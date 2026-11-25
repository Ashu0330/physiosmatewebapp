import { Component, input, output, computed, effect, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs/operators';
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
export class Sidebar extends BaseComponent {
  readonly activeTab = signal<string>('');
  readonly tabChange = output<string>();
  readonly menulist = signal<MenusModel[]>([]);
  readonly parentMenuId = input<number | null>(null);

  private previousParentMenuId: number | null = null;
  private latestMenuRequestToken = 0;

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  readonly consoleTitle = computed<string>(() => {
    const url = this.cleanRoutePath(this.currentUrl());
    const parentId = this.parentMenuId() || this.getStoredParentId();
    if (parentId === 2 || url.startsWith('/user-dashboard')) {
      return 'Patient Dashboard';
    }
    if (parentId === 22 || url.startsWith('/clinic-dashboard')) {
      return 'Clinic Console';
    }
    return 'Doctor Console';
  });

  readonly isSidebarActive = computed<boolean>(() => {
    if (!this.authService.isLoggedIn()) {
      return false;
    }
    const url = this.cleanRoutePath(this.currentUrl());
    const list = this.menulist();
    if (!list || list.length === 0 || !url) {
      return false;
    }
    const matchesMenu = list.some(menu => {
      const menuPath = this.cleanRoutePath(menu.path);
      return !!menuPath && (url === menuPath || url.startsWith(menuPath + '/'));
    });
    if (matchesMenu) {
      return true;
    }
    const parentId = this.parentMenuId() ?? this.getStoredParentId();
    return parentId === 22 && url.startsWith('/doctor-dashboard/') && url !== '/doctor-dashboard/settings';
  });

  constructor() {
    super();
    effect(() => {
      if (!this.authService.isLoggedIn()) {
        this.previousParentMenuId = null;
        this.menulist.set([]);
        return;
      }
      const parentId = this.parentMenuId();
      if (parentId !== null && parentId !== undefined) {
        // Valid ID received from header — persist it and load menus
        if (parentId !== this.previousParentMenuId || this.menulist().length === 0) {
          this.previousParentMenuId = parentId;
          this.setStoredParentId(parentId);
          this.GetAllMenu(parentId);
        }
      } else {
        const storedId = this.getStoredParentId();
        if (storedId && storedId !== this.previousParentMenuId) {
          this.previousParentMenuId = storedId;
          this.GetAllMenu(storedId);
        } else if (!storedId && this.previousParentMenuId !== null) {
          this.previousParentMenuId = null;
          this.menulist.set([]);
        }
      }
    });
  }

  private getStoredParentId(): number | null {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('parentId');
      return stored ? Number(stored) : null;
    }
    return null;
  }

  private setStoredParentId(id: number): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem('parentId', String(id));
    }
  }

  async GetAllMenu(parentId?: number | null): Promise<void> {
    const id = parentId !== undefined ? parentId : this.parentMenuId();
    if (id === null || id === undefined) {
      this.menulist.set([]);
      return;
    }
    const token = ++this.latestMenuRequestToken;
    const res = await this.apiService.Get<MenusModel[]>(
      `${ApiEndPoints.GetAllMenu}?Type=Sidebar&parentMenuId=${id}`
    );
    if (token !== this.latestMenuRequestToken) {
      return;
    }

    this.menulist.set(res.isSuccess ? (res.data ?? []) : []);
  }

  selectTab(itemOrTab: MenusModel | string): void {
    if (typeof itemOrTab === 'string') {
      this.activeTab.set(itemOrTab);
      this.tabChange.emit(itemOrTab);
      return;
    }
    const targetPath = this.normalizeRoutePath(itemOrTab.path);
    const tab = targetPath || itemOrTab.menuName || '';
    this.activeTab.set(tab);
    this.tabChange.emit(tab);
    if (targetPath) {
      this.router.navigateByUrl(targetPath);
    }
  }

  isTabActive(item: MenusModel): boolean {
    const url = this.cleanRoutePath(this.currentUrl());
    const itemPath = this.cleanRoutePath(item.path);
    if (!itemPath) {
      return this.activeTab() === item.menuName;
    }
    if (url === itemPath) {
      return true;
    }
    if (url && url.startsWith(itemPath + '/')) {
      const hasMoreSpecificMatch = this.menulist().some(other => {
        const otherPath = this.cleanRoutePath(other.path);
        return (
          otherPath.length > itemPath.length &&
          (url === otherPath || url.startsWith(otherPath + '/'))
        );
      });
      return !hasMoreSpecificMatch;
    }
    return false;
  }
}
