import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PracticeManagement } from './practice-management';

describe('PracticeManagement', () => {
  let component: PracticeManagement;
  let fixture: ComponentFixture<PracticeManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PracticeManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PracticeManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
