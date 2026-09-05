import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientMedicalrecords } from './patient-medicalrecords';

describe('PatientMedicalrecords', () => {
  let component: PatientMedicalrecords;
  let fixture: ComponentFixture<PatientMedicalrecords>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientMedicalrecords]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientMedicalrecords);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
