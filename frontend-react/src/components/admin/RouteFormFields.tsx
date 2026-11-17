import type { FormEvent } from 'react';
import type { Destination } from '../../types';
import { FormField } from './FormField';
import { INPUT_CLASS, type RouteFormValues } from './routeFormDefaults';

interface RouteFormFieldsProps {
  destinations: Destination[];
  values: RouteFormValues;
  onCountryChange: (country: string) => void;
  onChange: <K extends keyof RouteFormValues>(field: K, value: RouteFormValues[K]) => void;
  onSubmit: (event: FormEvent) => void;
  onCancel: () => void;
}

export function RouteFormFields({
  destinations,
  values,
  onCountryChange,
  onChange,
  onSubmit,
  onCancel,
}: RouteFormFieldsProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="País:">
          <select
            value={values.country}
            onChange={(event) => onCountryChange(event.target.value)}
            className={INPUT_CLASS}
          >
            {destinations.map((destination) => (
              <option key={destination.id} value={destination.country}>
                {destination.country}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Código de Tren:">
          <input
            type="text"
            required
            value={values.trainNumber}
            onChange={(event) => onChange('trainNumber', event.target.value)}
            className={`${INPUT_CLASS} font-mono`}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Ciudad Origen:">
          <input
            type="text"
            required
            value={values.fromCity}
            onChange={(event) => onChange('fromCity', event.target.value)}
            className={INPUT_CLASS}
          />
        </FormField>
        <FormField label="Ciudad Destino:">
          <input
            type="text"
            required
            value={values.toCity}
            onChange={(event) => onChange('toCity', event.target.value)}
            className={INPUT_CLASS}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <FormField label="Salida:">
          <input
            type="text"
            required
            value={values.departureTime}
            onChange={(event) => onChange('departureTime', event.target.value)}
            className={`${INPUT_CLASS} font-mono text-center`}
          />
        </FormField>
        <FormField label="Llegada:">
          <input
            type="text"
            required
            value={values.arrivalTime}
            onChange={(event) => onChange('arrivalTime', event.target.value)}
            className={`${INPUT_CLASS} font-mono text-center`}
          />
        </FormField>
        <FormField label="Tarifa Base (€):">
          <input
            type="number"
            min="1"
            required
            value={values.basePrice}
            onChange={(event) => onChange('basePrice', Number(event.target.value))}
            className={`${INPUT_CLASS} font-bold`}
          />
        </FormField>
      </div>

      <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md"
        >
          Guardar
        </button>
      </div>
    </form>
  );
}
