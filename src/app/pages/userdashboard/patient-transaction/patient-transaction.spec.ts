import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientTransaction } from './patient-transaction';

describe('PatientTransaction', () => {
  let component: PatientTransaction;
  let fixture: ComponentFixture<PatientTransaction>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientTransaction]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientTransaction);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
