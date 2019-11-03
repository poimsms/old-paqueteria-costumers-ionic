import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SeleccionarHoraComponent } from './seleccionar-hora.component';

describe('SeleccionarHoraComponent', () => {
  let component: SeleccionarHoraComponent;
  let fixture: ComponentFixture<SeleccionarHoraComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SeleccionarHoraComponent ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SeleccionarHoraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
