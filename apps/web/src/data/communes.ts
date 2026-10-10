export interface CommuneCatalogItem {
  cut: string;
  name: string;
  slug: string;
}

/**
 * Catálogo canónico de las 33 comunas de la Región del Biobío.
 * Ordenadas alfabéticamente para presentación consistente en formularios y selectores.
 */
export const BIOBIO_COMMUNES: CommuneCatalogItem[] = [
  { cut: '08314', name: 'Alto Biobío', slug: 'alto-biobio' },
  { cut: '08302', name: 'Antuco', slug: 'antuco' },
  { cut: '08202', name: 'Arauco', slug: 'arauco' },
  { cut: '08303', name: 'Cabrero', slug: 'cabrero' },
  { cut: '08205', name: 'Cañete', slug: 'canete' },
  { cut: '08103', name: 'Chiguayante', slug: 'chiguayante' },
  { cut: '08101', name: 'Concepción', slug: 'concepcion' },
  { cut: '08206', name: 'Contulmo', slug: 'contulmo' },
  { cut: '08102', name: 'Coronel', slug: 'coronel' },
  { cut: '08203', name: 'Curanilahue', slug: 'curanilahue' },
  { cut: '08104', name: 'Florida', slug: 'florida' },
  { cut: '08112', name: 'Hualpén', slug: 'hualpen' },
  { cut: '08105', name: 'Hualqui', slug: 'hualqui' },
  { cut: '08304', name: 'Laja', slug: 'laja' },
  { cut: '08201', name: 'Lebu', slug: 'lebu' },
  { cut: '08204', name: 'Los Álamos', slug: 'los-alamos' },
  { cut: '08301', name: 'Los Ángeles', slug: 'los-angeles' },
  { cut: '08106', name: 'Lota', slug: 'lota' },
  { cut: '08305', name: 'Mulchén', slug: 'mulchen' },
  { cut: '08306', name: 'Nacimiento', slug: 'nacimiento' },
  { cut: '08307', name: 'Negrete', slug: 'negrete' },
  { cut: '08107', name: 'Penco', slug: 'penco' },
  { cut: '08308', name: 'Quilaco', slug: 'quilaco' },
  { cut: '08309', name: 'Quilleco', slug: 'quilleco' },
  { cut: '08108', name: 'San Pedro de la Paz', slug: 'san-pedro-de-la-paz' },
  { cut: '08310', name: 'San Rosendo', slug: 'san-rosendo' },
  { cut: '08311', name: 'Santa Bárbara', slug: 'santa-barbara' },
  { cut: '08109', name: 'Santa Juana', slug: 'santa-juana' },
  { cut: '08110', name: 'Talcahuano', slug: 'talcahuano' },
  { cut: '08207', name: 'Tirúa', slug: 'tirua' },
  { cut: '08111', name: 'Tomé', slug: 'tome' },
  { cut: '08312', name: 'Tucapel', slug: 'tucapel' },
  { cut: '08313', name: 'Yumbel', slug: 'yumbel' },
];
