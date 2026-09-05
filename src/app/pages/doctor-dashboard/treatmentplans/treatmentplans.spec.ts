import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Treatmentplans } from './treatmentplans';

describe('Treatmentplans', () => {
  let component: Treatmentplans;
  let fixture: ComponentFixture<Treatmentplans>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Treatmentplans]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Treatmentplans);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
