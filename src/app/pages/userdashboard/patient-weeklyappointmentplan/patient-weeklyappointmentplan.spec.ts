import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientWeeklyappointmentplan } from './patient-weeklyappointmentplan';

describe('PatientWeeklyappointmentplan', () => {
  let component: PatientWeeklyappointmentplan;
  let fixture: ComponentFixture<PatientWeeklyappointmentplan>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientWeeklyappointmentplan]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientWeeklyappointmentplan);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
