import { Check, CheckCircle2 } from 'lucide-react';
import { MATRIX_SCENARIOS } from './parityScenarios';

export function ParityMatrix() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 rounded-2xl border border-slate-800 shadow-xl">
        <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full text-xs font-mono font-bold">
          REPORTE FORMAL DE HOMOGENEIDAD 2x2
        </span>
        <h2 className="text-xl font-black mt-2 tracking-tight">
          Matriz de Paridad Cruzada Frontend ↔ Backend
        </h2>
        <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
          Verificación de que las 4 combinaciones posibles operan bajo el mismo contrato de interfaz
          REST sin discrepancias.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {MATRIX_SCENARIOS.map((item) => (
          <article key={item.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
                {item.id} • {item.pairName}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <Check className="w-3.5 h-3.5" /> {item.status}
              </span>
            </div>

            <div className="space-y-1.5 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
              <MatrixRow label="Frontend" value={item.frontend} />
              <MatrixRow label="Backend" value={item.backend} />
              <div className="flex justify-between">
                <span className="text-slate-500">Latencia:</span>
                <span className="text-emerald-700 font-mono font-bold">{item.latency}</span>
              </div>
            </div>

            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Validaciones:
            </h4>
            <ul className="space-y-1 text-xs text-slate-600">
              {item.featuresValidated.map((feature) => (
                <li key={feature} className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}

function MatrixRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500">{label}:</span>
      <strong className="text-slate-800 text-right">{value}</strong>
    </div>
  );
}
