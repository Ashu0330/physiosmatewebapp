import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Specilization } from './specilization';

describe('Specilization', () => {
  let component: Specilization;
  let fixture: ComponentFixture<Specilization>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Specilization]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Specilization);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
