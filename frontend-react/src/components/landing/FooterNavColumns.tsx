import { COMPANY_LINKS, LEGAL_LINKS } from './footerData';

interface FooterNavColumnsProps {
  onGoHome: () => void;
  onGoBookings: () => void;
  onGoFaq: () => void;
  onGoDestinations: () => void;
}

const COLUMN_TITLE = 'text-[10px] font-black uppercase tracking-[0.2em] text-slate-500';
const LINK = 'transition-colors hover:text-white';

/** Columnas de navegación del pie de página. */
export function FooterNavColumns({
  onGoHome,
  onGoBookings,
  onGoFaq,
  onGoDestinations,
}: FooterNavColumnsProps) {
  return (
    <>
      <div>
        <h3 className={COLUMN_TITLE}>Explora</h3>
        <ul className="mt-4 space-y-2.5 text-xs font-semibold">
          <li>
            <button type="button" onClick={onGoDestinations} className={LINK}>
              Destinos por país
            </button>
          </li>
          <li>
            <button type="button" onClick={onGoBookings} className={LINK}>
              Mis billetes
            </button>
          </li>
          <li>
            <button type="button" onClick={onGoFaq} className={LINK}>
              Centro de ayuda
            </button>
          </li>
          <li>
            <button type="button" onClick={onGoHome} className={LINK}>
              Buscar trenes
            </button>
          </li>
        </ul>
      </div>

      <div>
        <h3 className={COLUMN_TITLE}>Compañía</h3>
        <ul className="mt-4 space-y-2.5 text-xs font-semibold">
          {COMPANY_LINKS.map((label) => (
            <li key={label}>
              <span className="cursor-default">{label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className={COLUMN_TITLE}>Legal</h3>
        <ul className="mt-4 space-y-2.5 text-xs font-semibold">
          {LEGAL_LINKS.map((label) => (
            <li key={label}>
              <span className="cursor-default">{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
