import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginVerifyPage } from './login-verify.page';

describe('LoginVerifyPage', () => {
  let component: LoginVerifyPage;
  let fixture: ComponentFixture<LoginVerifyPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LoginVerifyPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginVerifyPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
