import { CheckCircle2 } from 'lucide-react';

export type FeedbackMessage = { text: string; type: 'success' | 'error' } | null;

export function FeedbackBanner({ message }: { message: NonNullable<FeedbackMessage> }) {
  return (
    <div
      className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium shadow-md ${
        message.type === 'success'
          ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
          : 'bg-rose-50 border border-rose-200 text-rose-800'
      }`}
    >
      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
      <span>{message.text}</span>
    </div>
  );
}
