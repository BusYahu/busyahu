import type { Booking } from '../../types';
import { ETicketModal } from '../ETicketModal';

interface TicketModalOverlayProps {
  booking: Booking;
  onClose: () => void;
}

export function TicketModalOverlay({ booking, onClose }: TicketModalOverlayProps) {
  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950/65 p-4 backdrop-blur-sm sm:p-8">
      <div className="mx-auto max-w-2xl">
        <ETicketModal booking={booking} onClose={onClose} />
      </div>
    </div>
  );
}
