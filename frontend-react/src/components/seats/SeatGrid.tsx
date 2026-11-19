const ROWS = [1, 2, 3, 4, 5, 6];
const OCCUPIED_SEATS = ['1-C', '2-B', '4-A', '5-D'];

interface SeatGridProps {
  selectedSeats: string[];
  onToggleSeat: (seatId: string) => void;
}

export function SeatGrid({ selectedSeats, onToggleSeat }: SeatGridProps) {
  return (
    <div className="bg-slate-950 text-white rounded-3xl p-6 shadow-inner relative overflow-hidden">
      <div className="text-center text-[10px] font-mono tracking-widest text-indigo-300 uppercase mb-4">
        ▲▲ Locomotora (Sentido de Marcha) ▲▲
      </div>

      <div className="max-w-xs mx-auto space-y-2.5">
        {ROWS.map((row) => (
          <div key={row} className="flex items-center justify-between gap-2">
            {['A', 'B'].map((column) => (
              <Seat
                key={`${row}-${column}`}
                id={`${row}-${column}`}
                column={column}
                selectedSeats={selectedSeats}
                onToggleSeat={onToggleSeat}
              />
            ))}

            <div className="text-[10px] font-mono text-slate-400 font-bold px-2 py-1 bg-slate-900 rounded">
              Fila {row}
            </div>

            {['C', 'D'].map((column) => (
              <Seat
                key={`${row}-${column}`}
                id={`${row}-${column}`}
                column={column}
                selectedSeats={selectedSeats}
                onToggleSeat={onToggleSeat}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

interface SeatProps {
  id: string;
  column: string;
  selectedSeats: string[];
  onToggleSeat: (seatId: string) => void;
}

function Seat({ id, column, selectedSeats, onToggleSeat }: SeatProps) {
  const isOccupied = OCCUPIED_SEATS.includes(id);
  const isSelected = selectedSeats.includes(id);
  const position = column === 'A' || column === 'D' ? 'Vent.' : 'Pas.';

  return (
    <button
      type="button"
      disabled={isOccupied}
      onClick={() => onToggleSeat(id)}
      className={`w-11 h-11 rounded-xl text-xs font-bold font-mono transition-all flex flex-col items-center justify-center cursor-pointer ${
        isSelected
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/50 scale-105 ring-2 ring-indigo-300'
          : isOccupied
            ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
            : 'bg-slate-100 hover:bg-indigo-100 text-slate-900 border border-slate-300'
      }`}
    >
      <span>{id}</span>
      <span className="text-[8px] font-normal opacity-70">{position}</span>
    </button>
  );
}
