import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { apiresponse } from '../models/apiresponse';
import { environment } from '../environment/environment';

@Injectable({
  providedIn: 'root',
})
export class Masterservice {
  constructor(private http: HttpClient) { }

  // getlanguage() {
  //   return this.http.get<apiresponse<any>>(environment.baseUrl + 'Master/GetAllLanguages');
  // }
  getroles() {
    return this.http.get<apiresponse<any>>(environment.baseUrl + 'Master/GetAllRoles');
  }
  getSpecialization() {
    return this.http.get<apiresponse<any>>(environment.baseUrl + 'Master/GetAllSpecialization');
  }
  getAllServices() {
    return this.http.get<apiresponse<any>>(environment.baseUrl + 'Master/GetAllServices');
  }
  GetAllLanguages() {
    return this.http.get<apiresponse<any>>(environment.baseUrl + 'Master/GetAllLanguage');
  }
  GetAllQualification() {
    return this.http.get<apiresponse<any>>(environment.baseUrl + 'Master/GetAllQualification');
  }
  getstates() {
    return this.http.get<apiresponse<any>>(environment.baseUrl + 'Master/GetAllState');
  }
  getcities(stateId: number) {
    return this.http.get<apiresponse<any>>(environment.baseUrl + 'Master/GetAllCity?stateId=' + stateId);
  }
}
