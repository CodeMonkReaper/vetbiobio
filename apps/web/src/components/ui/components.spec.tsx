import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VerificationBadge } from './Badge';
import { PriceDisplay } from './display';
import { Button } from './Button';
import { Field, Input, Checkbox } from './fields';
import { Modal } from './Modal';

describe('VerificationBadge (§15)', () => {
  it('muestra fecha cuando está verificada', () => {
    render(<VerificationBadge status="VERIFIED" verifiedAt="2026-10-06T00:00:00Z" />);
    expect(screen.getByText(/Verificada el 2026-10-06/)).toBeDefined();
    expect(screen.getByText('✓')).toBeDefined();
  });

  it('nunca dice verificada sin estado VERIFIED', () => {
    render(<VerificationBadge status="PENDING_REVIEW" verifiedAt={null} />);
    expect(screen.queryByText(/Verificada el/)).toBeNull();
    expect(screen.getByText(/En revisión/)).toBeDefined();
    expect(screen.getByText('◷')).toBeDefined();
  });

  it('renderiza estado OUTDATED con símbolo de advertencia', () => {
    render(<VerificationBadge status="OUTDATED" verifiedAt="2025-01-01T00:00:00Z" />);
    expect(screen.getByText(/Posiblemente desactualizada/)).toBeDefined();
    expect(screen.getByText('⚠')).toBeDefined();
  });

  it('renderiza estado REJECTED con símbolo ✕', () => {
    render(<VerificationBadge status="REJECTED" />);
    expect(screen.getByText('Rechazada')).toBeDefined();
    expect(screen.getByText('✕')).toBeDefined();
  });

  it('renderiza estado UNVERIFIED con símbolo ⓘ', () => {
    render(<VerificationBadge status="UNVERIFIED" />);
    expect(screen.getByText('Sin verificar')).toBeDefined();
    expect(screen.getByText('ⓘ')).toBeDefined();
  });
});

describe('PriceDisplay (§16)', () => {
  it('renderiza rango con CLP y tabular-nums', () => {
    const { container } = render(<PriceDisplay min={20000} max={30000} type="RANGE" />);
    expect(screen.getByText('$20.000 – $30.000 CLP')).toBeDefined();
    expect(container.querySelector('.tabular-nums')).not.toBeNull();
  });

  it('renderiza precio exacto', () => {
    render(<PriceDisplay min={15000} max={null} type="FIXED" />);
    expect(screen.getByText('$15.000 CLP')).toBeDefined();
  });
});

describe('Button', () => {
  it('renderiza variantes y responde a clics', () => {
    const handleClick = vi.fn();
    render(
      <Button variant="primary" onClick={handleClick}>
        Continuar
      </Button>
    );
    const button = screen.getByRole('button', { name: /Continuar/ });
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('maneja estado isLoading deshabilitando el botón e indicando aria-busy', () => {
    const handleClick = vi.fn();
    render(
      <Button isLoading onClick={handleClick}>
        Guardando
      </Button>
    );
    const button = screen.getByRole('button', { name: /Guardando/ });
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.hasAttribute('disabled')).toBe(true);
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });
});

describe('Field & Input & Checkbox', () => {
  it('asocia label con input y renderiza hint y error accesibles', () => {
    render(
      <Field
        label="Correo institucional"
        htmlFor="email"
        required
        hint="Usa el correo corporativo del establecimiento"
        error="El correo es inválido"
      >
        <Input id="email" hasError />
      </Field>
    );

    const input = screen.getByLabelText(/Correo institucional/);
    expect(input).toBeDefined();
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByText('Usa el correo corporativo del establecimiento')).toBeDefined();

    const alertError = screen.getByRole('alert');
    expect(alertError.textContent).toBe('El correo es inválido');
  });

  it('checkbox accesible tiene etiqueta clicable y soporta selección', () => {
    const handleChange = vi.fn();
    render(
      <Checkbox
        id="urgencias"
        label="Atención de urgencia 24 horas"
        onChange={handleChange}
      />
    );
    const checkbox = screen.getByLabelText('Atención de urgencia 24 horas');
    fireEvent.click(checkbox);
    expect(handleChange).toHaveBeenCalled();
  });
});

describe('Modal accesible', () => {
  it('no se muestra cuando isOpen es falso', () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="Título Modal">
        Contenido
      </Modal>
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('se muestra con atributos ARIA y se cierra al presionar Escape o el botón cerrar', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Criterios de Confiabilidad">
        <p>Explicación del puntaje</p>
      </Modal>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(screen.getByText('Criterios de Confiabilidad')).toBeDefined();

    // Cierre por botón
    const closeBtn = screen.getByRole('button', { name: 'Cerrar ventana modal' });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    // Cierre por Escape
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(2);
  });
});
