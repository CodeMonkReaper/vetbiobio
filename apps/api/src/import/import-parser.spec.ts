import { ImportParserService } from './import-parser.service';

describe('ImportParserService', () => {
  let service: ImportParserService;

  beforeEach(() => {
    service = new ImportParserService();
  });

  describe('parseCsv', () => {
    it('parsea correctamente CSV delimitado por comas con cabeceras en español', () => {
      const csv = `nombre,direccion,comuna,telefono,email,latitud,longitud
Clínica Veterinaria Andalién,Paicaví 1200,Concepción,+56912345678,info@andalien.cl,-36.82,-73.05
Veterinaria San Pedro,Los Aromos 450,San Pedro de la Paz,412233445,contacto@vetsanpedro.cl,-36.84,-73.10`;

      const rows = service.parseCsv(csv);
      expect(rows.length).toBe(2);
      expect(rows[0]!['nombre']).toBe('Clínica Veterinaria Andalién');
      expect(rows[0]!['comuna']).toBe('Concepción');
      expect(rows[1]!['nombre']).toBe('Veterinaria San Pedro');
    });

    it('parsea correctamente CSV delimitado por punto y coma con comillas', () => {
      const csv = `nombre;direccion;comuna;telefono
"Clínica Veterinaria, San Pedro";"Av. Pedro Aguirre Cerda 1234, Local 2";San Pedro;+56987654321`;

      const rows = service.parseCsv(csv);
      expect(rows.length).toBe(1);
      expect(rows[0]!['nombre']).toBe('Clínica Veterinaria, San Pedro');
      expect(rows[0]!['direccion']).toBe('Av. Pedro Aguirre Cerda 1234, Local 2');
    });
  });

  describe('parseContent', () => {
    it('parsea array JSON correctamente', () => {
      const json = JSON.stringify([
        { name: 'Vet Biobío', address: 'O Higgins 500', commune: 'Concepción', phone: '+56911223344' },
      ]);
      const rows = service.parseContent(json, 'data.json');
      expect(rows.length).toBe(1);
      expect(rows[0]!['name']).toBe('Vet Biobío');
    });
  });

  describe('parseAndValidateRow', () => {
    it('valida y normaliza una fila limpia y completa', () => {
      const raw = {
        nombre: 'Clínica Veterinaria Concepción',
        direccion: 'Barros Arana 1020',
        comuna: '08101',
        telefono: '912345678',
        email: 'contacto@vetconcepcion.cl',
        web: 'www.vetconcepcion.cl',
        latitud: '-36.8260',
        longitud: '-73.0498',
        urgencias: 'true',
      };

      const parsed = service.parseAndValidateRow(raw, 1);
      expect(parsed.isValid).toBe(true);
      expect(parsed.validationErrors.length).toBe(0);
      expect(parsed.phoneE164).toBe('+56912345678');
      expect(parsed.website).toBe('https://www.vetconcepcion.cl');
      expect(parsed.latitude).toBe(-36.826);
      expect(parsed.longitude).toBe(-73.0498);
      expect(parsed.isEmergency).toBe(true);
    });

    it('detecta errores de coordenadas fuera del BBOX del Biobío', () => {
      const raw = {
        nombre: 'Clínica Veterinaria Santiago',
        direccion: 'Providencia 1200',
        comuna: 'Santiago',
        telefono: '+56912345678',
        latitud: '-33.45', // Fuera de Biobío
        longitud: '-70.66',
      };

      const parsed = service.parseAndValidateRow(raw, 2);
      expect(parsed.isValid).toBe(false);
      expect(parsed.validationErrors.some((e) => e.includes('fuera del límite geográfico'))).toBe(true);
    });

    it('detecta teléfono con formato inválido', () => {
      const raw = {
        nombre: 'Clínica San Martín',
        direccion: 'San Martín 450',
        comuna: 'Concepción',
        telefono: '12345',
      };

      const parsed = service.parseAndValidateRow(raw, 3);
      expect(parsed.isValid).toBe(false);
      expect(parsed.validationErrors.some((e) => e.includes('formato E.164'))).toBe(true);
    });
  });
});
