import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environment/environment';
import {
  ApiResponse,
  ProviderCatalogRequest,
  ProviderExpertise,
  ProviderSubscriptionPlan
} from '../models/practitioner.model';

@Injectable({
  providedIn: 'root',
})
export class ProviderCatalogService {
  private http = inject(HttpClient);

  getAllExpertise(request: ProviderCatalogRequest): Observable<ApiResponse<ProviderExpertise[]>> {
    return this.http.post<ApiResponse<ProviderExpertise[]>>(
      `${environment.baseUrl}ProviderCatalog/GetAllExpertise`,
      request
    );
  }

  getProviderPlans(request: ProviderCatalogRequest): Observable<ApiResponse<ProviderSubscriptionPlan[]>> {
    return this.http.post<ApiResponse<ProviderSubscriptionPlan[]>>(
      `${environment.baseUrl}ProviderCatalog/GetProviderPlans`,
      request
    );
  }
}
