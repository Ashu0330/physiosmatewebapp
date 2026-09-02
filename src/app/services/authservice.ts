import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { authmodel } from '../models/authmodel';
import { apiresponse } from '../models/apiresponse';
import { environment } from '../environment/environment';

@Injectable({
  providedIn: 'root',
})
export class Authservice {

  constructor(private http: HttpClient) { }

  login(model: any) {
    return this.http.post<apiresponse<authmodel>>(environment.baseUrl + 'Auth/Login', model);
  }

  register(model: any) {
    return this.http.post<apiresponse<authmodel>>(environment.baseUrl + 'Auth/Register', model);
  }


  sendRegistrationOtp(email: string) {
    const formData = new FormData();
    formData.append("Email", email);
    formData.append("IsLogin", "true");
    return this.http.post<apiresponse<any>>(`${environment.baseUrl}Auth/Register`, formData);
  }


  verifyOtp(payload: any) {
    return this.http.post<apiresponse<any>>(environment.baseUrl + 'Auth/VerifyOtp', payload);
  }

  resendOtp(payload: any) {
    return this.http.post<apiresponse<any>>(environment.baseUrl + 'Auth/ResendOtp', payload);
  }

  addPractitioner(model: any) {
    return this.http.post<apiresponse<any>>(environment.baseUrl + 'Practitioner/AddPractitioner', model);
  }

  addClinic(formData: FormData, params?: any) {
    return this.http.post<apiresponse<any>>(environment.baseUrl + 'Clinic/AddClinic', formData, { params });
  }

  getuserid() {
    const user = typeof localStorage !== 'undefined' ? localStorage.getItem('user') : null;
    if (user) {
      return JSON.parse(user).id;
    }
    return null;
  }

  setPendingVerification(model: any) {
    const data = model;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('pendingVerification', JSON.stringify(data));
    }
  }

  getPendingVerification() {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('pendingVerification') : null;
    return saved ? JSON.parse(saved) : null;
  }

  clearPendingVerification() {
    localStorage.removeItem('pendingVerification');
  }
  getUserName() {
    const user = typeof localStorage !== 'undefined' ? localStorage.getItem('user') : null;
    if (user) {
      return JSON.parse(user).fullName;
    }
    return null;
  }
  getUserProfilePic() {
    const user = typeof localStorage !== 'undefined' ? localStorage.getItem('user') : null;
    if (user) {
      return JSON.parse(user).profilePictureUrl;
    }
    return null;
  }

}
