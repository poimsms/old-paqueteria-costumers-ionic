import { TestBed } from '@angular/core/testing';

import { RidersService } from './riders.service';

describe('RidersService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: RidersService = TestBed.get(RidersService);
    expect(service).toBeTruthy();
  });
});
