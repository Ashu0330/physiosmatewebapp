import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environment/environment';
import {
  ApiResponse,
  ClinicDetailedData,
  ClinicFilter,
  ClinicSummary,
  PractitionerDetailedData,
  PractitionerFilter,
  PractitionerSummary
} from '../models/practitioner.model';

@Injectable({
  providedIn: 'root',
})
export class ExploreService {
  private http = inject(HttpClient);

  getPractitioners(filter: PractitionerFilter) {
    return this.http.post<ApiResponse<PractitionerSummary[]>>(`${environment.baseUrl}Explore/GetPractitioners`, filter);
  }

  getPractitionerById(practitionerId: number, userId: number) {
    return this.http.get<ApiResponse<PractitionerDetailedData>>(`${environment.baseUrl}Explore/GetPractitionerById?practitionerId=${practitionerId}&userId=${userId}`);
  }

  getClinics(filter: ClinicFilter) {
    return this.http.post<ApiResponse<ClinicSummary[]>>(`${environment.baseUrl}Explore/GetClinics`, filter);
  }

  getClinicById(clinicId: number, userId: number) {
    return this.http.get<ApiResponse<ClinicDetailedData>>(`${environment.baseUrl}Explore/GetClinicById?clinicId=${clinicId}&userId=${userId}`);
  }

  static createSlug(name: string, id: number): string {
    if (!name) return `provider-${id}`;
    const cleanName = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return `${cleanName}-${id}`;
  }

  static createClinicSlug(name: string, id: number): string {
    if (!name) return `clinic-${id}`;
    const cleanName = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return `${cleanName}-${id}`;
  }

  static extractIdFromSlug(slug: string | null | undefined): number | null {
    if (!slug) return null;
    if (/^\d+$/.test(slug)) {
      return parseInt(slug, 10);
    }
    const match = slug.match(/-(\d+)$/);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
    return null;
  }
}
