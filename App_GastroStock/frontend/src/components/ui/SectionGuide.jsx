import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronRight, BookOpen, Lightbulb } from 'lucide-react';

function SectionGuide({ title, steps = [], tips = [] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl card-shadow overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-primary/10 transition-colors"
      >
        <span className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-primary text-on-accent flex items-center justify-center flex-shrink-0">
            <HelpCircle size={18} />
          </span>
          <span>
            <span className="font-semibold text-gray-900 block text-sm">{title}</span>
            <span className="text-xs text-gray-500">Cómo usar esta sección</span>
          </span>
        </span>
        <span className="text-gray-500 flex-shrink-0">
          {open ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </span>
      </button>

      {open && (
        <div className="px-5 pb-5 pt-1 space-y-4">
          {steps.length > 0 && (
            <ol className="space-y-2.5">
              {steps.map((step, idx) => (
                <li key={idx} className="flex gap-3 text-sm text-gray-700">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-on-accent text-xs font-bold flex-shrink-0">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          )}

          {tips.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-primary/15">
              {tips.map((tip, idx) => (
                <p key={idx} className="flex gap-2.5 text-sm text-gray-600">
                  <Lightbulb size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <span><b className="text-amber-700">Consejo:</b> {tip}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SectionGuide;
