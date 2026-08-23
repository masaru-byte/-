/**
 * 3大指標カード コンポーネント
 *
 * - 家族が支えている介護時間（時間／週）
 * - 月あたりの自己負担額（円／月）
 * - 困りごとのうち、サービスにまかせられた数
 *
 * useCountUp による滑らかなカウントアップ／カウントダウンと、
 * 介護を「コスト」と呼ばない配慮のある文言で構成します。
 */

'use client';

import React from 'react';
import { TimelineMetrics } from '@/types';
import { useCountUp } from '@/hooks/useCountUp';
import { Clock, PiggyBank, CheckCircle2, TrendingDown, AlertTriangle } from 'lucide-react';

interface MetricsCardsProps {
  metrics: TimelineMetrics;
  initialFamilyHours: number;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({ metrics, initialFamilyHours }) => {
  const displayFamilyHours = useCountUp(metrics.familyHoursPerWeek, 350, 1);
  const displaySelfPay = useCountUp(metrics.selfPayPerMonth, 350, 0);
  const displayCovered = useCountUp(metrics.coveredSlotCount, 350, 0);

  // サービスに任せられた分だけ減った家族時間（週換算）
  const savedWeeklyHours = Math.max(0, initialFamilyHours - metrics.familyHoursPerWeek);
  const remainingSlots = Math.max(0, metrics.neededSlotCount - metrics.coveredSlotCount);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 指標1: 家族が支えている時間 */}
        <div className="relative overflow-hidden bg-white p-5 rounded-lg border border-stone-200">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2 text-rose-800">
              <div className="p-2 rounded-lg bg-rose-50">
                <Clock className="w-5 h-5 text-rose-700" />
              </div>
              <span className="text-xs font-bold tracking-wide">家族が支えている時間</span>
            </div>
            {savedWeeklyHours > 0 && (
              <span className="flex items-center space-x-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                <TrendingDown className="w-3.5 h-3.5" />
                <span className="tabular-nums">週 {savedWeeklyHours.toFixed(1)}h 減</span>
              </span>
            )}
          </div>

          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-4xl font-bold tracking-tight text-stone-900 tabular-nums">
              {displayFamilyHours}
            </span>
            <span className="text-sm font-semibold text-stone-500">時間／週</span>
          </div>

          <p className="mt-2 text-xs text-stone-500 leading-relaxed">
            {metrics.familyHoursPerWeek > 0 ? (
              <>
                サービスを当てはめても、1週間のうち{' '}
                <span className="font-semibold text-stone-800 tabular-nums">
                  {displayFamilyHours} 時間
                </span>{' '}
                は家族が担う計算です。
              </>
            ) : (
              <>登録した困りごとは、すべてサービスでまかなえる計算です。</>
            )}
          </p>

          <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500" />
        </div>

        {/* 指標2: 自己負担額 */}
        <div className="relative overflow-hidden bg-white p-5 rounded-lg border border-stone-200">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2 text-amber-800">
              <div className="p-2 rounded-lg bg-amber-50">
                <PiggyBank className="w-5 h-5 text-amber-700" />
              </div>
              <span className="text-xs font-bold tracking-wide">毎月かかるお金</span>
            </div>
            <span className="text-[10px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md shrink-0">
              保険1割＋自費
            </span>
          </div>

          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-4xl font-bold tracking-tight text-stone-900 tabular-nums">
              {displaySelfPay.toLocaleString()}
            </span>
            <span className="text-sm font-semibold text-stone-500">円／月</span>
          </div>

          <p className="mt-2 text-xs text-stone-500 leading-relaxed">
            介護保険の自己負担分と、保険外サービス（自費・シルバー人材・互助）の合計目安です。
          </p>

          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
        </div>

        {/* 指標3: サービスにまかせられた困りごと */}
        <div className="relative overflow-hidden bg-white p-5 rounded-lg border border-stone-200">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2 text-orange-800">
              <div className="p-2 rounded-lg bg-orange-50">
                <CheckCircle2 className="w-5 h-5 text-orange-700" />
              </div>
              <span className="text-xs font-bold tracking-wide">サービスにまかせられた数</span>
            </div>
            <span className="text-[11px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200 shrink-0 tabular-nums">
              {metrics.coverageRate}%
            </span>
          </div>

          <div className="mt-3 flex items-baseline space-x-1.5">
            <span className="text-4xl font-bold tracking-tight text-orange-900 tabular-nums">
              {displayCovered}
            </span>
            <span className="text-lg font-semibold text-stone-400 tabular-nums">
              / {metrics.neededSlotCount}
            </span>
            <span className="text-sm font-semibold text-stone-500 ml-1">件</span>
          </div>

          <p className="mt-2 text-xs text-stone-500 leading-relaxed">
            登録した困りごと{' '}
            <span className="font-semibold text-stone-800 tabular-nums">
              {metrics.neededSlotCount} 件
            </span>{' '}
            のうち、
            {remainingSlots > 0 ? (
              <>
                <span className="font-semibold text-stone-800 tabular-nums">
                  {remainingSlots} 件
                </span>{' '}
                は今も家族が担っています。
              </>
            ) : (
              <>すべてサービスでまかなえています。</>
            )}
          </p>

          <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-500" />
        </div>
      </div>

      {/* 支給限度基準額超過の注意表示 */}
      {metrics.isLimitExceeded && (
        <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 flex items-start space-x-3 text-amber-900 text-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">介護保険の支給限度額を超えています</span>
            <p className="mt-0.5 text-amber-800">
              上限を超えた単位数は10割（全額自己負担）として試算しています。ケアマネジャーと相談のうえ、優先度の高いサービスに絞るか、保険外サービスへの置き換えをご検討ください。
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
