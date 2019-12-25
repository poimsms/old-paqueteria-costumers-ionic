import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PagarComponent } from './pagar.component';

describe('PagarComponent', () => {
  let component: PagarComponent;
  let fixture: ComponentFixture<PagarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PagarComponent ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PagarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
