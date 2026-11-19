import type { TrainRoute } from '../../types';
import { SeatMap } from '../SeatMap';

interface SeatSelectionPageProps {
  train: TrainRoute;
  date: string;
  currencySymbol: string;
  onBack: () => void;
  onConfirmSeats: (seats: string[], seatClass: 'tourist' | 'first' | 'business', price: number) => void;
}

export function SeatSelectionPage({
  train,
  date,
  currencySymbol,
  onBack,
  onConfirmSeats,
}: SeatSelectionPageProps) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <SeatMap
        train={train}
        date={date}
        currencySymbol={currencySymbol}
        onBack={onBack}
        onConfirmSeats={onConfirmSeats}
      />
    </div>
  );
}
