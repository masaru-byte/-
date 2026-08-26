/**
 * 保険内外の境界説明カード コンポーネント
 * 
 * 訪問介護の生活援助における同居家族制限、通院等乗降介助と院内介助の境界、
 * 草むしり・ペットの世話など保険外自費サービスの境界ルールを自動判定してわかりやすく解説します。
 */

'use client';

import React, { useState } from 'react';
import { RESTRICTION_RULES } from '@/constants/careConstants';
import { CareLevel, HouseholdType } from '@/types';
import { ChevronDown, HelpCircle, AlertCircle } from 'lucide-react';

interface RestrictionGuideProps {
  selectedNeedIds: string[];
  householdType: HouseholdType;
  careLevel: CareLevel;
}

export const RestrictionGuide: React.FC<RestrictionGuideProps> = ({
  selectedNeedIds,
  householdType,
}) => {
  // 選択された困りごとに関連する境界ルールを抽出
  const [isOpen, setIsOpen] = useState(false);

  const activeRules = RESTRICTION_RULES.filter((rule) =>
    selectedNeedIds.includes(rule.needsTagId)
  );

  return (
    <div className="overflow-hidden rounded-[24px] border-2 border-[#2D231E] bg-white">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-controls="restriction-guide-details"
        className="flex min-h-14 w-full cursor-pointer select-none items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#FFF7F2] sm:px-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FDE8DC]">
          <HelpCircle className="h-5 w-5 text-[#B94716]" />
        </span>
        <span className="min-w-0 flex-1 text-sm font-bold text-[#2D231E] sm:text-base">
          保険でできること／自費になること
        </span>
        <span className="shrink-0 rounded-full bg-[#FDE8DC] px-2.5 py-1 text-sm font-bold text-[#9D3D12] tabular-nums">
          {activeRules.length} 件
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-[#756A64] transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <div
        id="restriction-guide-details"
        className="disclosure-collapse"
        data-open={isOpen ? 'true' : 'false'}
        hidden={!isOpen}
      >
        <div>
      <div className="space-y-4 border-t-2 border-[#FDE8DC] px-4 pb-5 pt-4 sm:px-5">
        <p className="text-sm leading-relaxed text-[#756A64]">
          ケアマネジャーや自治体への相談時に役立つ「保険適用の可否」と「自費サービスの活用ポイント」です。
        </p>

      {/* 世帯状況に応じた特記事項 */}
      {householdType === 'living_together' && (
        <div className="flex items-start gap-3 rounded-[20px] border-2 border-[#B94716] bg-[#FFF7F2] p-4 text-sm text-[#2D231E]">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#B94716]" />
          <div className="space-y-1">
            <span className="font-bold">同居家族がいらっしゃる場合の注意点</span>
            <p className="leading-relaxed text-[#5E514A]">
              同居家族がいる世帯では、原則として介護保険の「生活援助（掃除・洗濯・調理・買い物）」は算定できません。家族の就労や疾病等による「やむを得ない事情」の認定が必要となります。そのため、<strong>シルバー人材センター（1時間約1,350円）</strong>や<strong>民間家事代行（自費）</strong>の組み合わせが大変有効です。
            </p>
          </div>
        </div>
      )}

      {/* ルール一覧 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeRules.map((rule) => {
          return (
            <div
              key={rule.id}
              className="space-y-3 rounded-[20px] border-2 border-[#2D231E] bg-white p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm font-bold leading-relaxed text-[#2D231E]">{rule.title}</div>
                <span
                  className={`shrink-0 rounded-full border-2 px-2.5 py-1 text-[13px] font-bold ${
                    rule.isCovered === 'covered'
                      ? 'border-[#ED6A2C] bg-[#FDE8DC] text-[#9D3D12]'
                      : rule.isCovered === 'conditional'
                      ? 'border-[#B94716] bg-white text-[#B94716]'
                      : 'border-[#2D231E] bg-[#2D231E] text-white'
                  }`}
                >
                  {rule.isCovered === 'covered' && '保険適用可能'}
                  {rule.isCovered === 'conditional' && '条件付き適用'}
                  {rule.isCovered === 'not_covered' && '全額自費'}
                </span>
              </div>

              <p className="text-sm font-medium leading-relaxed text-[#5E514A]">
                {rule.conditionText}
              </p>

              <div className="rounded-2xl border border-[#ED6A2C] bg-[#FFF7F2] p-3 text-sm leading-relaxed text-[#5E514A]">
                💡 {rule.explanation}
              </div>

              <div className="text-[13px] leading-relaxed text-[#756A64]">
                根拠: {rule.officialSource}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-dashed border-[#B94716] bg-[#FFF7F2] p-3 text-sm italic leading-relaxed text-[#756A64]">
        ※ 実際のサービス利用可否や給付算定については、市区町村の地域包括支援センターまたは担当ケアマネジャーにご確認ください。
      </div>
      </div>
        </div>
      </div>
    </div>
  );
};
