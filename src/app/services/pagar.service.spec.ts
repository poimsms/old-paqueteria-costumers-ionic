import { TestBed } from '@angular/core/testing';

import { PagarService } from './pagar.service';

describe('PagarService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: PagarService = TestBed.get(PagarService);
    expect(service).toBeTruthy();
  });
});
