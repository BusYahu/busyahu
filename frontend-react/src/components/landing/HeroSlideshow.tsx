import type { HeroSlide } from '../../data/landing';

interface HeroSlideshowProps {
  slides: HeroSlide[];
  index: number;
  isAnimating: boolean;
  transitionMs: number;
}

/** Fondo fotográfico animado del hero (carrusel automático hacia la izquierda). */
export function HeroSlideshow({ slides, index, isAnimating, transitionMs }: HeroSlideshowProps) {
  return (
    <>
      <div className="absolute inset-0">
        <div
          className="flex h-full w-full will-change-transform"
          style={{
            width: `${slides.length * 100}%`,
            transform: `translate3d(-${(index * 100) / slides.length}%, 0, 0)`,
            transition: isAnimating
              ? `transform ${transitionMs}ms cubic-bezier(0.45, 0, 0.25, 1)`
              : 'none',
          }}
        >
          {slides.map((slide, slideIndex) => (
            <div
              key={`${slide.id}-${slideIndex}`}
              className="relative h-full"
              style={{ width: `${100 / slides.length}%` }}
            >
              <img
                src={slide.image}
                alt={slide.alt}
                className="h-full w-full object-cover"
                style={{ objectPosition: slide.imagePosition ?? 'center' }}
                loading={slideIndex === 0 ? 'eager' : 'lazy'}
                fetchPriority={slideIndex === 0 ? 'high' : 'auto'}
                referrerPolicy="no-referrer"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.92)_0%,rgba(2,6,23,0.66)_42%,rgba(2,6,23,0.18)_100%)]" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-slate-950/40" />
    </>
  );
}
