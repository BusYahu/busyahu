import { describe, expect, it } from 'vitest';
import { FARES, classMultiplier, priceForClass } from '../lib/seatClasses';

describe('tarifas por clase', () => {
  it('expone las tres clases comerciales', () => {
    expect(FARES.map((fare) => fare.id)).toEqual(['tourist', 'first', 'business']);
  });

  it('devuelve el multiplicador correcto', () => {
    expect(classMultiplier('tourist')).toBe(1);
    expect(classMultiplier('first')).toBe(1.4);
    expect(classMultiplier('business')).toBe(1.8);
  });

  it('calcula el precio redondeado por clase', () => {
    expect(priceForClass(100, 'tourist')).toBe(100);
    expect(priceForClass(100, 'first')).toBe(140);
    expect(priceForClass(65.5, 'first')).toBe(92);
  });

  it('cae a turista con una clase desconocida', () => {
    expect(priceForClass(50, 'suite' as never)).toBe(50);
  });
});
