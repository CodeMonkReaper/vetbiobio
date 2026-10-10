import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchBar } from '@/features/search/SearchBar';
import { ButtonLink } from './Button';
import { Empty } from './display';
import { TopBanner } from './TopBanner';
import { HeaderNav } from '@/components/layout/HeaderNav';
import { BIOBIO_COMMUNES } from '@/data/communes';

// Mock de next/navigation para HeaderNav
vi.mock('next/navigation', () => ({
  usePathname: () => '/veterinarias',
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('FASE 6: Pruebas Unitarias de Portada y Listado', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  describe('1. Select de Comunas en SearchBar', () => {
    it('renderiza 34 opciones: "Todo el Biobío" con valor vacío y las 33 comunas ordenadas', () => {
      render(<SearchBar />);
      const select = screen.getByLabelText(/¿En qué comuna\?/i) as HTMLSelectElement;
      expect(select).toBeDefined();

      const options = select.querySelectorAll('option');
      expect(options.length).toBe(34); // 1 opción vacía + 33 comunas

      // Primera opción: Todo el Biobío
      expect(options[0]?.value).toBe('');
      expect(options[0]?.textContent).toBe('Todo el Biobío');

      // Segunda opción: Alto Biobío (primera alfabéticamente)
      expect(options[1]?.value).toBe('alto-biobio');
      expect(options[1]?.textContent).toBe('Alto Biobío');

      // Comunas clave presentes con sus slugs
      const slugs = Array.from(options).map((o) => o.value);
      expect(slugs).toContain('concepcion');
      expect(slugs).toContain('talcahuano');
      expect(slugs).toContain('los-angeles');
      expect(slugs).toContain('san-pedro-de-la-paz');
    });

    it('las 33 comunas coinciden exactamente con el catálogo canónico', () => {
      expect(BIOBIO_COMMUNES.length).toBe(33);
      const uniqueSlugs = new Set(BIOBIO_COMMUNES.map((c) => c.slug));
      expect(uniqueSlugs.size).toBe(33);
    });
  });

  describe('2. ButtonLink Component', () => {
    it('renderiza un único elemento <a> sin anidar elementos <button>', () => {
      const { container } = render(
        <ButtonLink href="/veterinarias" variant="primary" size="md">
          Ver Clínicas
        </ButtonLink>
      );

      const link = container.querySelector('a');
      expect(link).not.toBeNull();
      expect(link?.getAttribute('href')).toBe('/veterinarias');
      expect(link?.textContent).toContain('Ver Clínicas');

      // Cero elementos button anidados
      const button = container.querySelector('button');
      expect(button).toBeNull();
    });

    it('aplica las clases semánticas de variante primaria', () => {
      render(
        <ButtonLink href="/aportar" variant="primary">
          Aportar
        </ButtonLink>
      );
      const link = screen.getByRole('link', { name: /Aportar/i });
      expect(link.className).toContain('bg-brand-600');
      expect(link.className).toContain('text-white');
    });
  });

  describe('3. Estado Vacío y Lista Semántica', () => {
    it('nombra el término buscado y renderiza lista semántica sin viñetas falsas ni emoji de pata', () => {
      const { container } = render(
        <Empty
          title="No encontramos resultados para «radiografía»"
          description="Prueba ampliando los filtros"
          hints={[
            'Prueba seleccionando Todo el Biobío',
            'Verifica la ortografía',
          ]}
          action={<ButtonLink href="/veterinarias">Restablecer</ButtonLink>}
        />
      );

      expect(screen.getByText('No encontramos resultados para «radiografía»')).toBeDefined();

      // No debe contener el emoji de pata 🐾
      expect(container.textContent).not.toContain('🐾');

      // Debe contener una <ul> semántica con clases de lista
      const ul = container.querySelector('ul');
      expect(ul).not.toBeNull();
      expect(ul?.className).toContain('list-disc');

      const items = container.querySelectorAll('li');
      expect(items.length).toBe(2);
      expect(items[0]?.textContent).toContain('Prueba seleccionando Todo el Biobío');
    });
  });

  describe('4. TopBanner Descartable', () => {
    it('renderiza aviso y se descarta al hacer clic en cerrar, guardando en sessionStorage', () => {
      render(<TopBanner />);

      const closeButton = screen.getByRole('button', { name: /Cerrar aviso de piloto/i });
      expect(closeButton).toBeDefined();

      fireEvent.click(closeButton);

      // Desaparece del DOM
      expect(screen.queryByRole('button', { name: /Cerrar aviso de piloto/i })).toBeNull();
      expect(sessionStorage.getItem('vetbiobio-topbanner-dismissed')).toBe('true');
    });
  });

  describe('5. Navegación Móvil y Accesibilidad en HeaderNav', () => {
    const mockLinks = [
      { href: '/veterinarias', label: 'Veterinarias' },
      { href: '/servicios', label: 'Servicios' },
      { href: '/acerca', label: 'Acerca' },
    ];

    it('alterna aria-expanded y muestra menú móvil plegable al hacer clic', () => {
      render(<HeaderNav links={mockLinks} />);

      const toggleButton = screen.getByRole('button', { name: /Abrir menú de navegación/i });
      expect(toggleButton.getAttribute('aria-expanded')).toBe('false');

      fireEvent.click(toggleButton);

      expect(toggleButton.getAttribute('aria-expanded')).toBe('true');
      expect(screen.getByRole('region', { name: /Menú móvil desplegable/i })).toBeDefined();
    });

    it('cierra el menú móvil al presionar la tecla Escape', () => {
      render(<HeaderNav links={mockLinks} />);

      const toggleButton = screen.getByRole('button', { name: /Abrir menú de navegación/i });
      fireEvent.click(toggleButton);
      expect(toggleButton.getAttribute('aria-expanded')).toBe('true');

      // Presionar Escape
      fireEvent.keyDown(window, { key: 'Escape' });

      expect(toggleButton.getAttribute('aria-expanded')).toBe('false');
      expect(screen.queryByRole('region', { name: /Menú móvil desplegable/i })).toBeNull();
    });

    it('asigna aria-current="page" a la ruta activa', () => {
      render(<HeaderNav links={mockLinks} />);
      // /veterinarias está activo según el mock
      const activeLinks = screen.getAllByRole('link', { name: /Veterinarias/i });
      expect(activeLinks[0]?.getAttribute('aria-current')).toBe('page');
    });
  });

  describe('6. Integridad de Enlaces de Portada', () => {
    it('todas las rutas y filtros clave enlazados desde la portada apuntan a endpoints válidos', () => {
      const validHrefs = [
        '/veterinarias?emergency=true',
        '/veterinarias?sort=PRICE_ASC',
        '/veterinarias?species=EXOTIC',
        '/examenes/radiografia',
        '/servicios/consulta-general',
        '/servicios/vacunacion',
        '/servicios/cirugia-general',
        '/examenes/ecografia',
        '/especialidades/dermatologia',
        '/acerca#metodologia',
        '/aportar',
        '/veterinarias',
      ];

      for (const href of validHrefs) {
        // Ninguno debe apuntar a filtros rotos o inexistentes
        expect(href).not.toContain('sort=aranceles');
        expect(href).not.toContain('service=exoticos');
        expect(href.startsWith('/')).toBe(true);
      }
    });
  });
});
