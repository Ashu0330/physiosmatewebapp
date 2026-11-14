import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Appointmentlist } from './appointmentlist';

describe('Appointmentlist', () => {
  let component: Appointmentlist;
  let fixture: ComponentFixture<Appointmentlist>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Appointmentlist]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Appointmentlist);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
