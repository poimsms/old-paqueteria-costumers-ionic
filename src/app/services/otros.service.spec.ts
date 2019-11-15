import { TestBed } from '@angular/core/testing';

import { OtrosService } from './otros.service';

describe('OtrosService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: OtrosService = TestBed.get(OtrosService);
    expect(service).toBeTruthy();
  });
});
