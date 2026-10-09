import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { SearchClinicsDto } from './search-clinics.dto';

describe('SearchClinicsDto (API-001 regression tests)', () => {
  it('permite valores válidos de animal_species', async () => {
    const validSpecies = ['DOG', 'CAT', 'RABBIT', 'BIRD', 'REPTILE', 'RODENT', 'EXOTIC', 'OTHER'];
    for (const sp of validSpecies) {
      const dto = plainToInstance(SearchClinicsDto, { species: sp });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    }
  });

  it('rechaza especies inválidas con error de validación (evita crash SQL 500)', async () => {
    const dto = plainToInstance(SearchClinicsDto, { species: 'perros_invalidos' });
    const errors = await validate(dto);
    expect(errors[0]?.property).toBe('species');
  });

  it('permite especie omitida o vacía', async () => {
    const dto = plainToInstance(SearchClinicsDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
