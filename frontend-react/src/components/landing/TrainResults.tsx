import React from 'react';
import type { Destination, TrainRoute } from '../../types';
import { EmptyTrainResults } from './EmptyTrainResults';
import { TrainResultCard } from './TrainResultCard';
import { TrainResultsHeader } from './TrainResultsHeader';

interface TrainResultsProps {
  destination?: Destination;
  fromCity: string;
  toCity: string;
  travelDate: string;
  trains: TrainRoute[];
  loading: boolean;
  onSelectTrain: (train: TrainRoute) => void;
  onReload: () => void;
}

export function TrainResults({
  destination,
  fromCity,
  toCity,
  travelDate,
  trains,
  loading,
  onSelectTrain,
  onReload,
}: TrainResultsProps) {
  return (
    <section id="resultados" className="scroll-mt-24 bg-slate-50 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <TrainResultsHeader
          destination={destination}
          fromCity={fromCity}
          toCity={toCity}
          travelDate={travelDate}
          trainCount={trains.length}
          loading={loading}
          onReload={onReload}
        />

        {trains.length === 0 ? (
          <EmptyTrainResults />
        ) : (
          <div className="mt-8 space-y-3">
            {trains.map((train) => (
              <TrainResultCard
                key={train.id}
                train={train}
                destination={destination}
                onSelectTrain={onSelectTrain}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
