import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Layoutwithheaderfooter } from './layoutwithheaderfooter';

describe('Layoutwithheaderfooter', () => {
  let component: Layoutwithheaderfooter;
  let fixture: ComponentFixture<Layoutwithheaderfooter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Layoutwithheaderfooter]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Layoutwithheaderfooter);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
