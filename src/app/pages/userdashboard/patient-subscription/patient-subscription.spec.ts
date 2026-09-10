import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { PatientSubscription } from './patient-subscription';

describe('PatientSubscription', () => {
  let component: PatientSubscription;
  let fixture: ComponentFixture<PatientSubscription>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientSubscription],
      providers: [provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientSubscription);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
