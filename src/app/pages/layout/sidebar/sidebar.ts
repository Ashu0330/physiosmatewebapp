import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { Authservice } from '../../../services/authservice';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { BaseComponent } from '../../../helper/base-component';

export type UserRole = 'doctor' | 'patient' | 'none';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar extends BaseComponent implements OnInit, OnDestroy {
  @Input() activeTab: string = '';
  @Output() tabChange = new EventEmitter<string>();

  userRole: UserRole = 'none';

  ngOnInit(): void {

  }

  ngOnDestroy(): void {

  }



  // private detectRole(): void {
  //   const url = this.router.url;
  //   if (url.startsWith('/doctor-dashboard')) {
  //     this.userRole = 'doctor';
  //   } else if (url.startsWith('/user-dashboard')) {
  //     this.userRole = 'patient';
  //   } else {
  //     const user = this.authService.getCurrentUser();
  //     if (user?.isPractitioner || user?.userType === 'Doctor') {
  //       this.userRole = 'doctor';
  //     } else if (this.authService.isLoggedIn()) {
  //       this.userRole = 'patient';
  //     } else {
  //       this.userRole = 'none';
  //     }
  //   }
  // }

  selectTab(tab: string): void {
    this.activeTab = tab;
    this.tabChange.emit(tab);
  }
}
