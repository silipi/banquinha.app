import { contrastRatio, readableTextOn } from './contrast.js';

describe('contrast', () => {
  it('measures black on white as 21:1', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21);
    expect(contrastRatio('#ffffff', '#ffffff')).toBe(1);
  });

  it('puts white text on dark and saturated colors', () => {
    expect(readableTextOn('#1a1714')).toBe('#ffffff');
    expect(readableTextOn('#4f7a3a')).toBe('#ffffff');
    expect(readableTextOn('#c2477a')).toBe('#ffffff');
  });

  it('puts dark text on light colors', () => {
    expect(readableTextOn('#fbefc4')).toBe('#1a1714');
    expect(readableTextOn('#ffd400')).toBe('#1a1714');
    expect(readableTextOn('#7dd3fc')).toBe('#1a1714');
  });
});
