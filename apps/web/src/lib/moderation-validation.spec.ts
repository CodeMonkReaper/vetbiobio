import { describe, it, expect } from 'vitest';
import { validateSubmissionForApproval } from './moderation-validation';

describe('validateSubmissionForApproval', () => {
  describe('NEW_CLINIC', () => {
    it('returns a blocking error if clinic name is missing or empty', () => {
      const issues = validateSubmissionForApproval('NEW_CLINIC', {}, false);
      expect(issues.some((i) => i.isBlocking && i.field === 'name')).toBe(true);
    });

    it('accepts nombre alias and returns only non-blocking warnings if contact is missing', () => {
      const issues = validateSubmissionForApproval('NEW_CLINIC', { nombre: 'Clínica San Roque' }, false);
      expect(issues.some((i) => i.isBlocking)).toBe(false);
      expect(issues.some((i) => !i.isBlocking && i.field === 'communeCut')).toBe(true);
    });

    it('passes with 0 issues when all required and recommended data is present', () => {
      const issues = validateSubmissionForApproval(
        'NEW_CLINIC',
        {
          name: 'Clínica Veterinaria Biobío',
          communeCut: '08101',
          phone: '+56912345678',
        },
        false
      );
      expect(issues.length).toBe(0);
    });
  });

  describe('UPDATE_PRICE', () => {
    it('blocks if clinic is not associated', () => {
      const issues = validateSubmissionForApproval(
        'UPDATE_PRICE',
        { serviceSlug: 'consulta-general', pricingType: 'FIXED', minAmount: 15000 },
        false
      );
      expect(issues.some((i) => i.isBlocking && i.message.includes('clínica asociada'))).toBe(true);
    });

    it('blocks if serviceSlug is missing', () => {
      const issues = validateSubmissionForApproval(
        'UPDATE_PRICE',
        { pricingType: 'FIXED', minAmount: 15000 },
        true
      );
      expect(issues.some((i) => i.isBlocking && i.field === 'serviceSlug')).toBe(true);
    });

    it('blocks if FIXED price is <= 0 or null', () => {
      const issues = validateSubmissionForApproval(
        'UPDATE_PRICE',
        { serviceSlug: 'consulta-general', pricingType: 'FIXED', minAmount: 0 },
        true
      );
      expect(issues.some((i) => i.isBlocking && i.field === 'minAmount')).toBe(true);
    });

    it('blocks if RANGE price has maxAmount < minAmount', () => {
      const issues = validateSubmissionForApproval(
        'UPDATE_PRICE',
        { serviceSlug: 'consulta-general', pricingType: 'RANGE', minAmount: 20000, maxAmount: 10000 },
        true
      );
      expect(issues.some((i) => i.isBlocking && i.field === 'maxAmount')).toBe(true);
    });

    it('approves a valid RANGE price', () => {
      const issues = validateSubmissionForApproval(
        'UPDATE_PRICE',
        { serviceSlug: 'consulta-general', pricingType: 'RANGE', minAmount: 15000, maxAmount: 25000 },
        true
      );
      expect(issues.length).toBe(0);
    });
  });

  describe('UPDATE_CLINIC', () => {
    it('blocks if not associated to a clinic', () => {
      const issues = validateSubmissionForApproval('UPDATE_CLINIC', { phone: '+56911112222' }, false);
      expect(issues.some((i) => i.isBlocking)).toBe(true);
    });

    it('blocks if payload is empty', () => {
      const issues = validateSubmissionForApproval('UPDATE_CLINIC', {}, true);
      expect(issues.some((i) => i.isBlocking)).toBe(true);
    });

    it('passes if associated to a clinic and has fields to update', () => {
      const issues = validateSubmissionForApproval('UPDATE_CLINIC', { phone: '+56911112222' }, true);
      expect(issues.length).toBe(0);
    });
  });

  describe('REPORT_CLOSURE', () => {
    it('blocks if no clinic is associated', () => {
      const issues = validateSubmissionForApproval('REPORT_CLOSURE', {}, false);
      expect(issues.some((i) => i.isBlocking)).toBe(true);
    });

    it('passes if clinic is associated', () => {
      const issues = validateSubmissionForApproval('REPORT_CLOSURE', {}, true);
      expect(issues.length).toBe(0);
    });
  });
});
