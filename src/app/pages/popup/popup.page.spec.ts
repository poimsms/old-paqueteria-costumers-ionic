import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupPage } from './popup.page';

describe('PopupPage', () => {
  let component: PopupPage;
  let fixture: ComponentFixture<PopupPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PopupPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PopupPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
