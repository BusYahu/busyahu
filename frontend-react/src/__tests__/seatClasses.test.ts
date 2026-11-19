import { describe, expect, it } from 'vitest';
import { SEAT_CLASSES, priceForClass } from '../components/seats/seatClasses';

describe('priceForClass', () => {
  it('aplica el multiplicador de cada clase', () => {
    expect(priceForClass(100, 'tourist')).toBe(100);
    expect(priceForClass(100, 'first')).toBe(140);
    expect(priceForClass(100, 'business')).toBe(180);
  });

  it('redondea la tarifa al entero más cercano', () => {
    expect(priceForClass(65.5, 'first')).toBe(92);
    expect(priceForClass(49.9, 'business')).toBe(90);
  });

  it('cae a turista cuando la clase no existe', () => {
    expect(priceForClass(50, 'suite' as never)).toBe(50);
  });

  it('expone las tres clases comerciales', () => {
    expect(SEAT_CLASSES.map((option) => option.id)).toEqual(['tourist', 'first', 'business']);
  });
});
