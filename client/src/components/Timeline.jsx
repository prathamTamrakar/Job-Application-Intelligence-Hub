import React from 'react';
import { Calendar, Circle, CheckCircle2 } from 'lucide-react';

const STATUS_CONFIGS = {
  Applied: { color: 'text-zinc-400 bg-zinc-950 border-zinc-700', dot: 'bg-zinc-500' },
  OA: { color: 'text-purple-400 bg-purple-950/30 border-purple-800/50', dot: 'bg-purple-500' },
  Interview: { color: 'text-blue-400 bg-blue-950/30 border-blue-800/50', dot: 'bg-blue-500' },
  Offer: { color: 'text-emerald-400 bg-emerald-950/30 border-emerald-800/50', dot: 'bg-emerald-500' },
  Rejected: { color: 'text-rose-400 bg-rose-950/30 border-rose-800/50', dot: 'bg-rose-500' },
  Ghosted: { color: 'text-amber-500 bg-amber-950/30 border-amber-800/50', dot: 'bg-amber-500' },
};

const Timeline = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div class="text-zinc-500 text-sm py-4 text-center">
        No status history available.
      </div>
    );
  }

  // Sort history chronologically (oldest first or newest first? Let's show newest first at top, or vice versa. Standard timeline is oldest first at top, or newest first. Let's sort oldest first so it reads top-to-bottom sequentially).
  const sortedHistory = [...history].sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));

  return (
    <div class="relative pl-6 border-l-2 border-zinc-800 space-y-8 ml-2">
      {sortedHistory.map((item, index) => {
        const isLast = index === sortedHistory.length - 1;
        const config = STATUS_CONFIGS[item.status] || STATUS_CONFIGS.Applied;
        const dateStr = new Date(item.updatedAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
        const timeStr = new Date(item.updatedAt).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        });

        return (
          <div key={item._id || index} class="relative">
            {/* Timeline Dot Indicator */}
            <span class="absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-darkBg border-2 border-zinc-800">
              <span class={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
            </span>

            <div class="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div class="flex items-center space-x-3">
                <span
                  class={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.color}`}
                >
                  {item.status}
                </span>
                <span class="text-xs text-textMuted flex items-center gap-1">
                  <Calendar size={12} />
                  {dateStr} at {timeStr}
                </span>
              </div>
            </div>

            {item.notes && (
              <p class="mt-2 text-sm text-zinc-300 bg-zinc-900/40 p-3 rounded-lg border border-zinc-800/40 max-w-xl">
                {item.notes}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Timeline;
