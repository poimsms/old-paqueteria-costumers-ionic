import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MisLugaresPage } from './mis-lugares.page';

describe('MisLugaresPage', () => {
  let component: MisLugaresPage;
  let fixture: ComponentFixture<MisLugaresPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MisLugaresPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MisLugaresPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
