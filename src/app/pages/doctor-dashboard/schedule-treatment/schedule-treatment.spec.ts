import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduleTreatment } from './schedule-treatment';

describe('ScheduleTreatment', () => {
  let component: ScheduleTreatment;
  let fixture: ComponentFixture<ScheduleTreatment>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduleTreatment]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScheduleTreatment);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
