import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Doctordetail } from './doctordetail';

describe('Doctordetail', () => {
  let component: Doctordetail;
  let fixture: ComponentFixture<Doctordetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Doctordetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Doctordetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
