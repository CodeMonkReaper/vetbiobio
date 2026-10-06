// Seed comunas Biobío — 33 comunas. CUT a validar contra SUBDERE/INE antes de prod.
// Uso: pnpm db:seed (implementar inserción vía Prisma cuando haya DB).
export const BIOBIO_COMMUNES = [
  // Provincia Concepción (12)
  { cut: '08101', name: 'Concepción', slug: 'concepcion' },
  { cut: '08102', name: 'Coronel', slug: 'coronel' },
  { cut: '08103', name: 'Chiguayante', slug: 'chiguayante' },
  { cut: '08104', name: 'Florida', slug: 'florida' },
  { cut: '08105', name: 'Hualqui', slug: 'hualqui' },
  { cut: '08106', name: 'Lota', slug: 'lota' },
  { cut: '08107', name: 'Penco', slug: 'penco' },
  { cut: '08108', name: 'San Pedro de la Paz', slug: 'san-pedro-de-la-paz' },
  { cut: '08109', name: 'Santa Juana', slug: 'santa-juana' },
  { cut: '08110', name: 'Talcahuano', slug: 'talcahuano' },
  { cut: '08111', name: 'Tomé', slug: 'tome' },
  { cut: '08112', name: 'Hualpén', slug: 'hualpen' },
  // Provincia Arauco (7)
  { cut: '08201', name: 'Lebu', slug: 'lebu' },
  { cut: '08202', name: 'Arauco', slug: 'arauco' },
  { cut: '08203', name: 'Curanilahue', slug: 'curanilahue' },
  { cut: '08204', name: 'Los Álamos', slug: 'los-alamos' },
  { cut: '08205', name: 'Cañete', slug: 'canete' },
  { cut: '08206', name: 'Contulmo', slug: 'contulmo' },
  { cut: '08207', name: 'Tirúa', slug: 'tirua' },
  // Provincia Biobío (14)
  { cut: '08301', name: 'Los Ángeles', slug: 'los-angeles' },
  { cut: '08302', name: 'Antuco', slug: 'antuco' },
  { cut: '08303', name: 'Cabrero', slug: 'cabrero' },
  { cut: '08304', name: 'Laja', slug: 'laja' },
  { cut: '08305', name: 'Mulchén', slug: 'mulchen' },
  { cut: '08306', name: 'Nacimiento', slug: 'nacimiento' },
  { cut: '08307', name: 'Negrete', slug: 'negrete' },
  { cut: '08308', name: 'Quilaco', slug: 'quilaco' },
  { cut: '08309', name: 'Quilleco', slug: 'quilleco' },
  { cut: '08310', name: 'San Rosendo', slug: 'san-rosendo' },
  { cut: '08311', name: 'Santa Bárbara', slug: 'santa-barbara' },
  { cut: '08312', name: 'Tucapel', slug: 'tucapel' },
  { cut: '08313', name: 'Yumbel', slug: 'yumbel' },
  { cut: '08314', name: 'Alto Biobío', slug: 'alto-biobio' },
];

export const SEED_SERVICES = [
  'consulta-general', 'vacunacion', 'desparasitacion', 'cirugia-general',
  'hospitalizacion', 'atencion-urgencias', 'esterilizacion', 'castracion',
  'limpieza-dental', 'peluqueria',
];

// Radiografía y ecografía son EXÁMENES (decisión #3), no servicios.
export const SEED_EXAMS = [
  'radiografia', 'ecografia', 'hemograma', 'perfil-bioquimico', 'urianalisis',
  'test-parvovirus', 'test-distemper', 'citologia', 'biopsia',
];
