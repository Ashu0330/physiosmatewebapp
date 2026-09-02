import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { apiresponse } from '../models/apiresponse';
import { environment } from '../environment/environment';
import { SavedPractitioner, UserSubscription } from '../models/practitioner.model';
import { MyBooking } from '../models/usermode';

@Injectable({
  providedIn: 'root',
})
export class Userservice {
  private http = inject(HttpClient)

  SavePractitioner(model: any) {
    return this.http.post<apiresponse<any>>(environment.baseUrl + `User/SavePractitioner`, model);
  }
  GetSavedPractitioners(userId: number) {
    return this.http.get<apiresponse<SavedPractitioner[]>>(environment.baseUrl + `User/SavedPractitioners?userId=${userId}`);
  }
  RemoveSavedPractitioner(practitionerId: number) {
    return this.http.get<apiresponse<any>>(environment.baseUrl + `User/RemoveSavedPractitioner?practitionerId=${practitionerId}`);
  }
  GetProviderAvailability(practitionerid: number) {
    return this.http.get<apiresponse<any>>(environment.baseUrl + `Consultancy/GetAvailability?practitionerId=${practitionerid}`);
  }
  BookConsultancy(model: any) {
    return this.http.post<apiresponse<any>>(environment.baseUrl + `Consultancy/BookConsultancy`, model);
  }
  GetMyBookings() {
    return this.http.get<apiresponse<MyBooking[]>>(environment.baseUrl + `Consultancy/MyBookings`);
  }
  AddUserSubscription(model: any) {
    return this.http.post<apiresponse<any>>(environment.baseUrl + `User/AddUserSubscription`, model);
  }
  GetUserSubscription(model: any) {
    return this.http.post<apiresponse<UserSubscription[]>>(environment.baseUrl + `User/GetUserSubscription`, model);
  }
}
