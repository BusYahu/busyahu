import type { Destination } from '../../types';
import type { HeroSlide } from '../../data/landing';
import { Flag } from './Flag';

interface HeroCaptionProps {
  slide: HeroSlide;
  destination?: Destination;
}

/** Rótulo dinámico sincronizado con la fotografía activa. */
export function HeroCaption({ slide, destination }: HeroCaptionProps) {
  return (
    <div className="absolute bottom-4 right-4 z-20 flex items-center gap-3 rounded-2xl border border-white/20 bg-slate-950/60 px-3.5 py-2.5 shadow-2xl backdrop-blur-xl sm:bottom-5 sm:right-6 sm:px-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
        <Flag
          code={destination?.countryCode ?? slide.countryId}
          country={slide.country}
          className="h-5 w-7"
        />
      </span>
      <div>
        <div className="text-[9px] font-bold uppercase tracking-[0.22em] text-white/55">En imagen</div>
        <div key={slide.id} className="caption-in text-sm font-extrabold text-white">
          {slide.landmark}, {slide.city}
        </div>
        <div className="text-[10px] font-medium text-white/65">{slide.country}</div>
      </div>
    </div>
  );
}
