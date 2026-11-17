import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Mail, MessageCircle, PhoneCall, ShieldCheck } from 'lucide-react';
import { FAQ_ITEMS } from '../../data/landing';

export function FAQAccordion() {
  const [openItems, setOpenItems] = useState<string[]>([FAQ_ITEMS[0]?.id ?? '']);

  const toggleItem = (itemId: string) => {
    setOpenItems((current) =>
      current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId],
    );
  };

  return (
    <section id="ayuda" className="scroll-mt-24 bg-white py-16 sm:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16 lg:px-8">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-800">
            <HelpCircle className="h-3.5 w-3.5" />
            Centro de ayuda
          </span>
          <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">
            Todo claro antes de subir al tren.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-600">
            Respuestas directas sobre documentación, embarque, equipaje, validación del QR,
            cancelaciones y mascotas. Si no encuentras lo que buscas, nuestro equipo está disponible
            todos los días.
          </p>

          <div className="mt-7 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Atención 24/7
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-800">
              ¿Necesitas ayuda con un viaje en curso?
            </p>
            <div className="mt-4 space-y-3 text-sm">
              <a
                href="mailto:ayuda@busyahu.com"
                className="flex items-center gap-3 font-semibold text-slate-700 transition-colors hover:text-emerald-700"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                  <Mail className="h-4 w-4" />
                </span>
                ayuda@busyahu.com
              </a>
              <a
                href="tel:+34900123456"
                className="flex items-center gap-3 font-semibold text-slate-700 transition-colors hover:text-emerald-700"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                  <PhoneCall className="h-4 w-4" />
                </span>
                +34 900 123 456
              </a>
              <button
                type="button"
                className="flex items-center gap-3 font-semibold text-slate-700 transition-colors hover:text-emerald-700"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                  <MessageCircle className="h-4 w-4" />
                </span>
                Chat en vivo con un asesor
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item) => {
            const isOpen = openItems.includes(item.id);
            return (
              <article
                key={item.id}
                className={`overflow-hidden rounded-2xl border bg-white transition-all duration-300 ${
                  isOpen
                    ? 'border-emerald-300 shadow-[0_18px_50px_-30px_rgba(5,150,105,0.55)]'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-${item.id}`}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                      isOpen ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <HelpCircle className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
                      {item.category}
                    </span>
                    <span className="mt-1 block text-sm font-extrabold leading-snug text-slate-900 sm:text-[15px]">
                      {item.question}
                    </span>
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 text-emerald-700' : ''
                    }`}
                  />
                </button>

                <div
                  id={`faq-${item.id}`}
                  className="grid transition-[grid-template-rows,opacity] duration-300 ease-out"
                  style={{ gridTemplateRows: isOpen ? '1fr' : '0fr', opacity: isOpen ? 1 : 0 }}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 pl-[72px] text-sm leading-relaxed text-slate-600 sm:px-6 sm:pb-6 sm:pl-[76px]">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
