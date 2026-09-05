import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { apiresponse } from '../models/apiresponse';
import { environment } from '../environment/environment';

@Injectable({
  providedIn: 'root',
})
export class DoctorDashboardService {
  private http = inject(HttpClient);

  GetPatients() {
    return this.http.get<apiresponse<any[]>>(environment.baseUrl + `Doctor/Patients`);
  }

  GetPatientById(patientId: string | number) {
    return this.http.get<apiresponse<any>>(environment.baseUrl + `Doctor/Patient?id=${patientId}`);
  }

  AddPatient(model: any) {
    return this.http.post<apiresponse<any>>(environment.baseUrl + `Doctor/AddPatient`, model);
  }

  GetTreatmentPlans() {
    return this.http.get<apiresponse<any[]>>(environment.baseUrl + `Doctor/TreatmentPlans`);
  }

  AddTreatmentPlan(model: any) {
    return this.http.post<apiresponse<any>>(environment.baseUrl + `Doctor/AddTreatmentPlan`, model);
  }

  GetAppointments() {
    return this.http.get<apiresponse<any[]>>(environment.baseUrl + `Doctor/Appointments`);
  }

  GetStats(period?: string) {
    const query = period ? `?period=${period}` : '';
    return this.http.get<apiresponse<any>>(environment.baseUrl + `Doctor/Stats${query}`);
  }

  UpdateAppointmentStatus(model: any) {
    return this.http.post<apiresponse<any>>(environment.baseUrl + `Doctor/UpdateAppointmentStatus`, model);
  }
}
