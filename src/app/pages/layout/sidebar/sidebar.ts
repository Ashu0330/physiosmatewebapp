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

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  readonly isSidebarActive = computed<boolean>(() => {
    this.currentUrl();
    const list = this.menulist();
    if (!list || list.length === 0) {
      return false;
    }
    return list.some(menu => {
      if (!menu.path) {
        return false;
      }
      return this.router.isActive(menu.path, {
        paths: 'exact',
        queryParams: 'ignored',
        matrixParams: 'ignored',
        fragment: 'ignored'
      });
    });
  });

  constructor() {
    super();
    effect(() => {
      const parentId = this.parentMenuId();
      if (parentId !== null && parentId !== undefined) {
        // Valid ID received from header — persist it and load menus
        this.previousParentMenuId = parentId;
        this.setStoredParentId(parentId);
        this.GetAllMenu(parentId);
      } else {
        // parentMenuId is null (e.g. on refresh before header resolves).
        // Try restoring from localStorage safely.
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
    const res = await this.apiService.Get<MenusModel[]>(
      `${ApiEndPoints.GetAllMenu}?Type=Sidebar&parentMenuId=${id}`
    );
    this.menulist.set(res.isSuccess ? (res.data ?? []) : []);
  }

  selectTab(itemOrTab: MenusModel | string): void {
    if (typeof itemOrTab === 'string') {
      this.activeTab.set(itemOrTab);
      this.tabChange.emit(itemOrTab);
      return;
    }
    const tab = itemOrTab.path || itemOrTab.menuName || '';
    this.activeTab.set(tab);
    this.tabChange.emit(tab);
    if (itemOrTab.path && itemOrTab.path.startsWith('/')) {
      this.router.navigateByUrl(itemOrTab.path);
    }
  }

  isTabActive(item: MenusModel): boolean {
    this.currentUrl();
    if (item.path) {
      return this.router.isActive(item.path, {
        paths: 'exact',
        queryParams: 'ignored',
        matrixParams: 'ignored',
        fragment: 'ignored'
      });
    }
    return this.activeTab() === item.menuName;
  }
}
