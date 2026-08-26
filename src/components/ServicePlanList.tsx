/**
 * このプランで使うサービス一覧
 *
 * 28マスを眺めなくても「結局どのサービスを何回使って、いくらかかるのか」が
 * 分かるように、割り当て済みサービスをまとめて表示します。
 */

'use client';

import React, { useMemo } from 'react';
import { Service, TimelineSlot } from '@/types';
import { SCHEME_LABELS } from '@/utils/colors';
import { ArrowRight } from 'lucide-react';

interface ServicePlanListProps {
  slots: TimelineSlot[];
  onSelectSlot: (slot: TimelineSlot) => void;
}

interface PlanRow {
  service: Service;
  timesPerWeek: number;
  monthlyCost: number;
  firstSlot: TimelineSlot;
}

export const ServicePlanList: React.FC<ServicePlanListProps> = ({ slots, onSelectSlot }) => {
  const rows = useMemo<PlanRow[]>(() => {
    const map = new Map<string, PlanRow>();
    for (const slot of slots) {
      const svc = slot.assignedService;
      if (!svc) continue;
      const existing = map.get(svc.id);
      if (existing) {
        existing.timesPerWeek += 1;
        existing.monthlyCost += slot.cost;
      } else {
        map.set(svc.id, {
          service: svc,
          timesPerWeek: 1,
          monthlyCost: slot.cost,
          firstSlot: slot,
        });
      }
    }
    // 仕様どおり「安い順」に並べる
    return [...map.values()].sort((a, b) => a.monthlyCost - b.monthlyCost);
  }, [slots]);

  const total = rows.reduce((sum, r) => sum + r.monthlyCost, 0);

  if (rows.length === 0) {
    return (
      <div className="rounded-[24px] border-2 border-[#2D231E] bg-[#FFF7F2] p-6 text-center text-[14px] font-semibold leading-relaxed text-[#756A64] shadow-[0_4px_0_#2D231E]">
        まだサービスが割り当てられていません。
        <br />
        予算を上げるか、タイムラインのカードから個別に選んでください。
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-[24px] border-2 border-[#2D231E] bg-white shadow-[0_4px_0_#2D231E]">
      <div className="border-b-2 border-[#2D231E] px-6 py-6 sm:px-7">
        <h2 className="font-display text-[22px] font-bold text-[#2D231E]">頼むサービス</h2>
        <p className="mt-1.5 text-[14px] text-[#6E625B] tabular-nums">
          {rows.length} 種類・安い順・合計 ¥{Math.round(total).toLocaleString()}／月
        </p>
      </div>

      <ul className="space-y-3 p-3 sm:p-4">
        {rows.map((row) => {
          const scheme = SCHEME_LABELS[row.service.scheme];
          return (
            <li
              key={row.service.id}
              className="rounded-[20px] border-2 border-[#2D231E] bg-white transition-colors hover:bg-[#FFF7F2]"
            >
              <button
                type="button"
                onClick={() => onSelectSlot(row.firstSlot)}
                aria-label={`${row.service.name}の詳しい内容を見る`}
                className="press flex min-h-[132px] w-full flex-col gap-4 rounded-[18px] px-4 py-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B94716] sm:min-h-[116px] sm:flex-row sm:items-center sm:px-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex min-h-8 shrink-0 items-center rounded-full border-2 border-[#2D231E] bg-[#FDE8DC] px-3 text-[13px] font-extrabold text-[#7B2D0E]"
                    >
                      {scheme.label}
                    </span>
                    <span className="min-w-0 truncate text-[13px] font-semibold text-[#756A64]">
                      {row.service.providerName}
                    </span>
                  </div>
                  <div className="text-[17px] font-extrabold leading-snug text-[#2D231E]">
                    {row.service.name}
                  </div>
                  {row.service.description && (
                    <p className="mt-2 line-clamp-2 text-[13px] font-medium leading-relaxed text-[#756A64]">
                      {row.service.description}
                    </p>
                  )}
                </div>

                <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:max-w-[360px] sm:justify-end">
                  <span className="inline-flex min-h-10 items-center rounded-full border-2 border-[#D9C9C0] bg-[#FFF7F2] px-3 text-[13px] font-bold text-[#5E4D45] tabular-nums">
                    週 {row.timesPerWeek} 回
                  </span>
                  <span className="inline-flex min-h-10 items-center rounded-full border-2 border-[#ED6A2C] bg-white px-3 text-[13px] font-extrabold text-[#9D3D12] tabular-nums">
                    月 {row.monthlyCost > 0 ? `¥${Math.round(row.monthlyCost).toLocaleString()}` : '無料'}
                  </span>
                  <span className="ml-auto inline-flex min-h-11 items-center gap-1.5 rounded-full bg-[#C4511A] px-4 text-[13px] font-extrabold text-white sm:ml-0">
                    詳しく見る
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
