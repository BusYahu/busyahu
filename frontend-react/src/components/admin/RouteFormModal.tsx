import { useState, type FormEvent } from 'react';
import type { Destination, TrainRoute } from '../../types';
import { RouteFormFields } from './RouteFormFields';
import {
  buildInitialRouteValues,
  buildRouteFromForm,
  type RouteFormValues,
} from './routeFormDefaults';

interface RouteFormModalProps {
  destinations: Destination[];
  editingTrain: TrainRoute | null;
  onClose: () => void;
  onSave: (train: TrainRoute, isEdit: boolean) => void;
}

export function RouteFormModal({
  destinations,
  editingTrain,
  onClose,
  onSave,
}: RouteFormModalProps) {
  const [values, setValues] = useState<RouteFormValues>(() => buildInitialRouteValues(editingTrain));

  function update<K extends keyof RouteFormValues>(field: K, value: RouteFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  const handleCountryChange = (countryName: string) => {
    const destination = destinations.find(
      (candidate) => candidate.country.toLowerCase() === countryName.toLowerCase(),
    );
    setValues((current) => {
      if (!destination || destination.cities.length < 2) {
        return { ...current, country: countryName };
      }
      return {
        ...current,
        country: countryName,
        fromCity: destination.cities[0].name,
        toCity: destination.cities[1].name,
        currency: destination.currency,
      };
    });
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSave(buildRouteFromForm(values, editingTrain), Boolean(editingTrain));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <h3 className="text-lg font-black text-slate-900">
            {editingTrain ? 'Editar Ruta' : 'Crear Nueva Ruta de Tren'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold">
            ✕
          </button>
        </div>

        <RouteFormFields
          destinations={destinations}
          values={values}
          onCountryChange={handleCountryChange}
          onChange={update}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}
