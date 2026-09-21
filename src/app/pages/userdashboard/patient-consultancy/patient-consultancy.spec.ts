import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientConsultancy } from './patient-consultancy';

describe('PatientConsultancy', () => {
  let component: PatientConsultancy;
  let fixture: ComponentFixture<PatientConsultancy>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientConsultancy]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientConsultancy);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
