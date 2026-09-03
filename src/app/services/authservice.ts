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
    debugger
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

  isLoggedIn(): boolean {
    if (typeof localStorage === 'undefined') return false;
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token || user);
  }

  getToken(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem('token');
  }

  getCurrentUser(): any {
    if (typeof localStorage === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  saveUserSession(userData: any, token?: string): void {
    if (typeof localStorage === 'undefined') return;
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    }
    if (token) {
      localStorage.setItem('token', token);
    } else if (userData?.token) {
      localStorage.setItem('token', userData.token);
    }
  }

  logout(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('pendingVerification');
    }
  }
}
