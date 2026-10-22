import {
  PLATFORM_ROOT_PATHS,
  findStoreHandleProblem,
  toStoreHandle,
} from './store-handle.js';

describe('toStoreHandle', () => {
  it.each([
    ['Plantinhas do Paulo', 'plantinhas-do-paulo'],
    ['  Mimos da Luluca!! ', 'mimos-da-luluca'],
    ['Pão & Café', 'pao-cafe'],
    ['---', ''],
  ])('%s -> %s', (input, expected) => {
    expect(toStoreHandle(input)).toBe(expected);
  });

  it('truncates to max length without a trailing hyphen', () => {
    expect(toStoreHandle('a'.repeat(29) + ' bcd')).toBe('a'.repeat(29));
  });
});

describe('findStoreHandleProblem', () => {
  it('accepts valid handles', () => {
    expect(findStoreHandleProblem('clara-joias')).toBeNull();
  });

  it.each([
    ['ab', 'too_short'],
    ['clara--joias', 'invalid'],
    ['clara_joias', 'invalid'],
    ['api', 'reserved'],
    ['clara.joias', 'invalid'],
    ['clara/joias', 'invalid'],
    ['clara%20joias', 'invalid'],
  ])('%s -> %s', (handle, problem) => {
    expect(findStoreHandleProblem(handle)).toBe(problem);
  });

  it.each(PLATFORM_ROOT_PATHS)('reserves the web app root path /%s', (path) => {
    expect(findStoreHandleProblem(path)).toBe('reserved');
  });
});
