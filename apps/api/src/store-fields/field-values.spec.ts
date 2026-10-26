import { BadRequestException } from '@nestjs/common';
import {
  checkFieldShape,
  checkFieldValues,
  currentFieldValues,
  formatCardValue,
  formatFieldValue,
  type FieldDefinition,
} from './field-values.js';

const field = (
  id: string,
  type: FieldDefinition['type'],
  extra: Partial<FieldDefinition> = {},
): FieldDefinition => ({
  id,
  label: id,
  type,
  unit: null,
  options: null,
  ...extra,
});

const year = field('Ano', 'number');
const km = field('Km', 'number', { unit: 'km' });
const color = field('Cor', 'text');
const gearbox = field('Câmbio', 'choice', {
  options: ['Manual', 'Automático'],
});
const trade = field('Aceita troca', 'boolean');
const fields = [year, km, color, gearbox, trade];

describe('checkFieldShape', () => {
  it('keeps a trimmed unit only for numbers', () => {
    expect(checkFieldShape({ type: 'number', unit: ' km ' })).toEqual({
      unit: 'km',
      options: null,
    });
    expect(checkFieldShape({ type: 'number', unit: '  ' }).unit).toBeNull();
    expect(checkFieldShape({ type: 'text', unit: 'km' })).toEqual({
      unit: null,
      options: null,
    });
  });

  it('trims choice options and drops empty ones', () => {
    expect(
      checkFieldShape({ type: 'choice', options: [' Manual ', '', 'Auto'] }),
    ).toEqual({ unit: null, options: ['Manual', 'Auto'] });
  });

  it('refuses choices with fewer than two options or repeated ones', () => {
    expect(() => checkFieldShape({ type: 'choice', options: ['Sim'] })).toThrow(
      'Dê pelo menos duas opções',
    );
    expect(() => checkFieldShape({ type: 'choice' })).toThrow(
      BadRequestException,
    );
    expect(() =>
      checkFieldShape({ type: 'choice', options: ['Manual', 'manual'] }),
    ).toThrow('A opção "manual" está repetida');
  });

  it('ignores options for other types', () => {
    expect(
      checkFieldShape({ type: 'boolean', options: ['a', 'b'] }).options,
    ).toBeNull();
  });
});

describe('checkFieldValues', () => {
  it('accepts a value of each type', () => {
    expect(
      checkFieldValues(fields, {
        Ano: 2019,
        Km: 45000.5,
        Cor: '  Prata ',
        Câmbio: 'Automático',
        'Aceita troca': false,
      }),
    ).toEqual({
      Ano: 2019,
      Km: 45000.5,
      Cor: 'Prata',
      Câmbio: 'Automático',
      'Aceita troca': false,
    });
  });

  it('drops null, empty text and an empty choice', () => {
    expect(
      checkFieldValues(fields, { Ano: null, Cor: '   ', Câmbio: '' }),
    ).toEqual({});
  });

  it('rounds numbers to two decimal places', () => {
    expect(checkFieldValues([km], { Km: 1.239 })).toEqual({ Km: 1.24 });
  });

  it('refuses a value of the wrong type', () => {
    expect(() => checkFieldValues(fields, { Ano: '2019' })).toThrow(
      'Valor inválido em "Ano"',
    );
    expect(() => checkFieldValues(fields, { Cor: 12 })).toThrow(
      'Valor inválido em "Cor"',
    );
    expect(() => checkFieldValues(fields, { 'Aceita troca': 'sim' })).toThrow(
      'Valor inválido em "Aceita troca"',
    );
    expect(() => checkFieldValues(fields, { Ano: Number.NaN })).toThrow(
      BadRequestException,
    );
  });

  it('refuses a choice that is not one of the options', () => {
    expect(() => checkFieldValues(fields, { Câmbio: 'CVT' })).toThrow(
      'Escolha uma das opções de "Câmbio"',
    );
  });

  it('refuses text that is too long and numbers that are too high', () => {
    expect(() => checkFieldValues(fields, { Cor: 'x'.repeat(81) })).toThrow(
      '"Cor" está muito longo',
    );
    expect(() => checkFieldValues(fields, { Km: 2e9 })).toThrow(
      '"Km" está muito alto',
    );
  });

  it('refuses a field that is not one of the store fields', () => {
    expect(() => checkFieldValues(fields, { Motor: '1.0' })).toThrow(
      BadRequestException,
    );
  });
});

describe('currentFieldValues', () => {
  it('follows the order of the fields and skips missing values', () => {
    expect(
      currentFieldValues(fields, { Cor: 'Prata', Ano: 2019 }).map(
        ({ field, value }) => [field.id, value],
      ),
    ).toEqual([
      ['Ano', 2019],
      ['Cor', 'Prata'],
    ]);
  });

  it('skips values that no longer fit their field', () => {
    expect(
      currentFieldValues(fields, {
        Câmbio: 'CVT', // option removed since
        Ano: 'dois mil', // stored under another type
        Cor: '',
        Motor: '1.0', // field deleted
      }),
    ).toEqual([]);
  });
});

describe('formatFieldValue', () => {
  it('formats numbers in pt-BR, with the unit', () => {
    expect(formatFieldValue(km, 45000)).toBe('45.000 km');
    expect(formatFieldValue(km, 1.5)).toBe('1,5 km');
  });

  it('keeps four-digit numbers such as years without a separator', () => {
    expect(formatFieldValue(year, 2019)).toBe('2019');
  });

  it('writes yes or no and keeps text as is', () => {
    expect(formatFieldValue(trade, true)).toBe('Sim');
    expect(formatFieldValue(trade, false)).toBe('Não');
    expect(formatFieldValue(gearbox, 'Manual')).toBe('Manual');
  });
});

describe('formatCardValue', () => {
  it('uses the field name for a yes and skips a no', () => {
    expect(formatCardValue(trade, true)).toBe('Aceita troca');
    expect(formatCardValue(trade, false)).toBeNull();
  });

  it('uses just the value for the other types', () => {
    expect(formatCardValue(km, 45000)).toBe('45.000 km');
    expect(formatCardValue(color, 'Prata')).toBe('Prata');
  });
});
