import React from 'react';
import { FooterBottomBar } from './FooterBottomBar';
import { FooterBrand } from './FooterBrand';
import { FooterNavColumns } from './FooterNavColumns';

interface SiteFooterProps {
  onGoHome: () => void;
  onGoBookings: () => void;
  onGoFaq: () => void;
  onGoDestinations: () => void;
  onOpenAdmin: () => void;
}

export function SiteFooter({
  onGoHome,
  onGoBookings,
  onGoFaq,
  onGoDestinations,
  onOpenAdmin,
}: SiteFooterProps) {
  return (
    <footer className="bg-slate-950 text-slate-400">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:px-8">
        <FooterBrand onGoHome={onGoHome} />
        <FooterNavColumns
          onGoHome={onGoHome}
          onGoBookings={onGoBookings}
          onGoFaq={onGoFaq}
          onGoDestinations={onGoDestinations}
        />
      </div>

      <FooterBottomBar onOpenAdmin={onOpenAdmin} />
    </footer>
  );
}
