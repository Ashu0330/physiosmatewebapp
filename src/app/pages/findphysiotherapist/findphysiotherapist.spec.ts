import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Findphysiotherapist } from './findphysiotherapist';

describe('Findphysiotherapist', () => {
  let component: Findphysiotherapist;
  let fixture: ComponentFixture<Findphysiotherapist>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Findphysiotherapist]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Findphysiotherapist);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
