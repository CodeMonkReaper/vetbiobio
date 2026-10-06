import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VerificationBadge } from './Badge';
import { PriceDisplay } from './display';

describe('VerificationBadge (§15)', () => {
  it('muestra fecha cuando está verificada', () => {
    render(<VerificationBadge status="VERIFIED" verifiedAt="2026-10-06T00:00:00Z" />);
    expect(screen.getByText(/Verificada el 2026-10-06/)).toBeDefined();
  });
  it('nunca dice verificada sin estado VERIFIED', () => {
    render(<VerificationBadge status="PENDING_REVIEW" verifiedAt={null} />);
    expect(screen.queryByText(/Verificada el/)).toBeNull();
    expect(screen.getByText(/En revisión/)).toBeDefined();
  });
});

describe('PriceDisplay (§16)', () => {
  it('renderiza rango con CLP', () => {
    render(<PriceDisplay min={20000} max={30000} type="RANGE" />);
    expect(screen.getByText('$20.000 – $30.000 CLP')).toBeDefined();
  });
});
