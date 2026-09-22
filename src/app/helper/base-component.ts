import { ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Loader } from '../services/loader';
import { SweetAlertService } from '../services/sweet-alert.service';
import { Authservice } from '../services/authservice';
import { ApiService } from '../services/api.service';
import { AppMessage } from './app-message';
import { FormBuilder } from '@angular/forms';

export abstract class BaseComponent {
    protected loader = inject(Loader);
    protected alert = inject(SweetAlertService);
    protected authService = inject(Authservice);
    protected apiService = inject(ApiService);
    protected router = inject(Router);
    protected destroyRef = inject(DestroyRef);
    protected cdr = inject(ChangeDetectorRef);
    protected fb = inject(FormBuilder);

    public pagination = {
        currentPage: 1,
        itemsPerPage: 15,
        totalItems: 0,
    };


    refreshData(methodName?: string): void {
        this.pagination.currentPage = 1;
        this.pagination.totalItems = 0;
        this.callMethod(methodName);
    }

    onPageChange(page: number, methodName?: string): void {
        this.pagination.currentPage = page;
        this.callMethod(methodName);
    }

    onPageSizeChange(size: number | Event, methodName?: string): void {
        const parsed = (typeof size === 'object' && (size as any)?.target)
            ? Number((size as any).target.value)
            : Number(size);
        this.pagination.itemsPerPage = isNaN(parsed) ? 15 : parsed;
        this.pagination.currentPage = 1;
        this.callMethod(methodName);
    }

    showSuccess(message: string = AppMessage.SaveSuccess): void {
        this.alert.toastSuccess(message);
    }

    showError(message: string = AppMessage.ServerError): void {
        this.alert.toastError(message);
    }


    get currentUser(): any {
        return this.authService.getCurrentUser();
    }

    /** Returns true when a user session exists. */
    get isLoggedIn(): boolean {
        return this.authService.isLoggedIn();
    }


    private callMethod(methodName?: string): void {
        if (methodName && typeof (this as any)[methodName] === 'function') {
            (this as any)[methodName]();
        }
    }
}
