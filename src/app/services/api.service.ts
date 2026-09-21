import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../environment/environment';
import { apiresponse } from '../models/apiresponse';
import { Loader } from './loader';
import { SweetAlertService } from './sweet-alert.service';
import { AppMessage } from '../helper/app-message';

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private http = inject(HttpClient);
    private loader = inject(Loader);
    private alert = inject(SweetAlertService);

    // ─── GET ────────────────────────────────────────────────────────────────────

    async Get<T>(apiUrl: string): Promise<apiresponse<T>> {
        this.loader.startLoader();
        try {
            return await firstValueFrom(
                this.http.get<apiresponse<T>>(`${environment.baseUrl}${apiUrl}`)
            );
        } catch (err: any) {
            this.alert.toastError(err?.error?.message || err?.message || AppMessage.ServerError);
            return { isSuccess: false, message: err?.message || AppMessage.ServerError, data: undefined as any, responseCode: 500 };
        } finally {
            this.loader.stopLoader();
        }
    }

    // ─── POST ───────────────────────────────────────────────────────────────────

    async Post<T>(apiUrl: string, data?: any): Promise<apiresponse<T>> {
        this.loader.startLoader();
        try {
            return await firstValueFrom(
                this.http.post<apiresponse<T>>(`${environment.baseUrl}${apiUrl}`, data ?? {})
            );
        } catch (err: any) {
            this.alert.toastError(err?.error?.message || err?.message || AppMessage.ServerError);
            return { isSuccess: false, message: err?.message || AppMessage.ServerError, data: undefined as any, responseCode: 500 };
        } finally {
            this.loader.stopLoader();
        }
    }

    // ─── PUT ────────────────────────────────────────────────────────────────────

    async Put<T>(apiUrl: string, data?: any): Promise<apiresponse<T>> {
        this.loader.startLoader();
        try {
            return await firstValueFrom(
                this.http.put<apiresponse<T>>(`${environment.baseUrl}${apiUrl}`, data ?? {})
            );
        } catch (err: any) {
            this.alert.toastError(err?.error?.message || err?.message || AppMessage.ServerError);
            return { isSuccess: false, message: err?.message || AppMessage.ServerError, data: undefined as any, responseCode: 500 };
        } finally {
            this.loader.stopLoader();
        }
    }

    // ─── DELETE ─────────────────────────────────────────────────────────────────

    async Delete<T>(apiUrl: string, confirmMessage: string = AppMessage.Delete): Promise<apiresponse<T>> {
        const confirm = await this.alert.confirmDelete('Are you sure?', confirmMessage);
        if (!confirm?.isConfirmed) {
            return { isSuccess: false, message: 'Operation cancelled', data: undefined as any, responseCode: 0 };
        }

        this.loader.startLoader();
        try {
            return await firstValueFrom(
                this.http.delete<apiresponse<T>>(`${environment.baseUrl}${apiUrl}`)
            );
        } catch (err: any) {
            this.alert.toastError(err?.error?.message || err?.message || AppMessage.ServerError);
            return { isSuccess: false, message: err?.message || AppMessage.ServerError, data: undefined as any, responseCode: 500 };
        } finally {
            this.loader.stopLoader();
        }
    }

    // ─── POST with FormData (file uploads) ──────────────────────────────────────

    async PostForm<T>(apiUrl: string, formData: FormData): Promise<apiresponse<T>> {
        this.loader.startLoader();
        try {
            return await firstValueFrom(
                this.http.post<apiresponse<T>>(`${environment.baseUrl}${apiUrl}`, formData)
            );
        } catch (err: any) {
            this.alert.toastError(err?.error?.message || err?.message || AppMessage.ServerError);
            return { isSuccess: false, message: err?.message || AppMessage.ServerError, data: undefined as any, responseCode: 500 };
        } finally {
            this.loader.stopLoader();
        }
    }
}
