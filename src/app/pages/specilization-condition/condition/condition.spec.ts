import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Condition } from './condition';

describe('Condition', () => {
  let component: Condition;
  let fixture: ComponentFixture<Condition>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Condition]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Condition);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
