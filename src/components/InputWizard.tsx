/**
 * 5ステップ入力ウィザード コンポーネント
 *
 * 1. 要介護認定区分（未申請／要支援／要介護をグループ化して選択）
 * 2. 世帯状況
 * 3. 困りごと（ケアの種類ごとにグループ化したタグ選択）
 * 4. 発生する曜日・時間帯
 * 5. 月額予算
 */

'use client';

import React, { useState } from 'react';
import {
  CARE_LEVEL_LIMITS,
  DAYS_OF_WEEK,
  NEEDS_TAGS,
  TIME_PERIODS,
} from '@/constants/careConstants';
import {
  CareLevel,
  DayOfWeek,
  HouseholdType,
  NeedsCategory,
  SlotId,
  TimePeriod,
  UserInputData,
} from '@/types';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Home,
  UserCheck,
  Users,
  MapPin,
  CalendarDays,
} from 'lucide-react';

interface InputWizardProps {
  initialData: UserInputData;
  onSubmit: (data: UserInputData) => void;
  onLoadDemo: () => void;
}

/** 認定区分を3グループに整理して表示（支給限度額などの詳細は出さない） */
const CARE_LEVEL_GROUPS: { label: string; note?: string; levels: CareLevel[] }[] = [
  { label: '認定を受けていない', levels: ['unapplied', 'unknown'] },
  { label: '要支援', note: '1〜2', levels: ['support_1', 'support_2'] },
  { label: '要介護', note: '1〜5', levels: ['care_1', 'care_2', 'care_3', 'care_4', 'care_5'] },
];

/** 認定区分ボタンに出す短いラベル */
const CARE_LEVEL_SHORT: Record<CareLevel, string> = {
  unapplied: 'まだ申請していない',
  unknown: '区分がわからない',
  support_1: '要支援1',
  support_2: '要支援2',
  care_1: '要介護1',
  care_2: '要介護2',
  care_3: '要介護3',
  care_4: '要介護4',
  care_5: '要介護5',
};

const HOUSEHOLDS: { id: HouseholdType; title: string; desc: string; icon: React.ElementType }[] = [
  {
    id: 'single',
    title: '独居（一人暮らし）',
    desc: '日中の安否確認・配食・見守りが最優先になります。',
    icon: UserCheck,
  },
  {
    id: 'elderly_only',
    title: '高齢者のみ世帯',
    desc: '重い家事や通院、夜間の見守りを外部に頼る必要があります。',
    icon: Users,
  },
  {
    id: 'living_together',
    title: '同居家族あり',
    desc: '保険の生活援助に制限があるため、保険外サービスの併用が有効です。',
    icon: Home,
  },
  {
    id: 'long_distance',
    title: '遠距離介護',
    desc: '遠隔の見守り、緊急駆けつけ、訪問代行が中心になります。',
    icon: MapPin,
  },
];

/** ケアの種類ごとのグループ見出し */
const NEEDS_CATEGORIES: { key: NeedsCategory; label: string; hint: string }[] = [
  { key: 'housework', label: '家事', hint: '調理・掃除・洗濯・買い物' },
  { key: 'physical_care', label: '身体介護', hint: '入浴・排泄・服薬・着替え' },
  { key: 'monitoring', label: '見守り・安否確認', hint: '日中の声かけ／夜間の不安' },
  { key: 'outing', label: '外出の付き添い', hint: '通院・買い物・手続き' },
  { key: 'social', label: '社会参加・つながり', hint: 'デイサービス・話し相手' },
  { key: 'housing', label: '住まい・環境', hint: '庭木・軽作業・寝具' },
  { key: 'family_rest', label: '家族の休息', hint: 'レスパイト・相談' },
];

/** タスク1件あたりの発生タイミング */
interface TaskTiming {
  days: DayOfWeek[];
  periods: TimePeriod[];
}
type TaskSchedule = Record<string, TaskTiming>;

const WEEKDAYS: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri'];
const WEEKEND: DayOfWeek[] = ['sat', 'sun'];
const ALL_DAYS: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

/** 既存の slotNeeds から、タスクごとの曜日・時間帯を復元する */
function scheduleFromSlotNeeds(
  selectedNeeds: string[],
  slotNeeds: Record<string, string | null>
): TaskSchedule {
  const out: TaskSchedule = {};
  for (const needId of selectedNeeds) {
    const days = new Set<DayOfWeek>();
    const periods = new Set<TimePeriod>();
    for (const [slotId, value] of Object.entries(slotNeeds)) {
      if (value !== needId) continue;
      const [d, p] = slotId.split('-') as [DayOfWeek, TimePeriod];
      days.add(d);
      periods.add(p);
    }
    // 未設定のタスクは、タグの既定時間帯を平日に置く
    if (days.size === 0 || periods.size === 0) {
      const tag = NEEDS_TAGS.find((t) => t.id === needId);
      out[needId] = { days: [], periods: tag ? [...tag.defaultSlots] : [] };
    } else {
      out[needId] = { days: [...days], periods: [...periods] };
    }
  }
  return out;
}

/**
 * タスクごとの「曜日 × 時間帯」を28マスへ展開する。
 * selectedNeeds の順に書き込むため、同じマスが重なった場合は後のタスクが優先される。
 */
function scheduleToSlotNeeds(
  selectedNeeds: string[],
  schedule: TaskSchedule
): Record<SlotId, string | null> {
  const out = {} as Record<SlotId, string | null>;
  for (const d of DAYS_OF_WEEK) {
    for (const p of TIME_PERIODS) {
      out[`${d.key}-${p.key}`] = null;
    }
  }
  for (const needId of selectedNeeds) {
    const timing = schedule[needId];
    if (!timing) continue;
    for (const day of timing.days) {
      for (const period of timing.periods) {
        out[`${day}-${period}`] = needId;
      }
    }
  }
  return out;
}

export const InputWizard: React.FC<InputWizardProps> = ({
  initialData,
  onSubmit,
  onLoadDemo,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  // 前進か後退かで、切り替わる向きを変える
  const [direction, setDirection] = useState<'fwd' | 'back'>('fwd');
  const [formData, setFormData] = useState<UserInputData>(initialData);
  // タスクごとの発生タイミング（ステップ4の入力源）
  const [schedule, setSchedule] = useState<TaskSchedule>(() =>
    scheduleFromSlotNeeds(initialData.selectedNeeds, initialData.slotNeeds)
  );

  /** スケジュールを更新し、28マスへ展開して formData に反映する */
  const applySchedule = (next: TaskSchedule, needsOrder?: string[]) => {
    setSchedule(next);
    setFormData((prev) => {
      const order = needsOrder ?? prev.selectedNeeds;
      return { ...prev, slotNeeds: scheduleToSlotNeeds(order, next) };
    });
  };

  const toggleTaskDay = (needId: string, day: DayOfWeek) => {
    const cur = schedule[needId] ?? { days: [], periods: [] };
    const days = cur.days.includes(day)
      ? cur.days.filter((d) => d !== day)
      : [...cur.days, day];
    applySchedule({ ...schedule, [needId]: { ...cur, days } });
  };

  const setTaskDays = (needId: string, days: DayOfWeek[]) => {
    const cur = schedule[needId] ?? { days: [], periods: [] };
    const same =
      cur.days.length === days.length && days.every((d) => cur.days.includes(d));
    applySchedule({ ...schedule, [needId]: { ...cur, days: same ? [] : days } });
  };

  const toggleTaskPeriod = (needId: string, period: TimePeriod) => {
    const cur = schedule[needId] ?? { days: [], periods: [] };
    const periods = cur.periods.includes(period)
      ? cur.periods.filter((p) => p !== period)
      : [...cur.periods, period];
    applySchedule({ ...schedule, [needId]: { ...cur, periods } });
  };

  const handleCareLevelChange = (level: CareLevel) => {
    setFormData((prev) => ({ ...prev, careLevel: level }));
  };

  const handleHouseholdChange = (type: HouseholdType) => {
    setFormData((prev) => ({ ...prev, householdType: type }));
  };

  /** ニーズのトグル。追加時は既定の時間帯を平日に置き、外したら予定も消す */
  const toggleNeed = (needId: string) => {
    const exists = formData.selectedNeeds.includes(needId);
    const newNeeds = exists
      ? formData.selectedNeeds.filter((id) => id !== needId)
      : [...formData.selectedNeeds, needId];

    const nextSchedule = { ...schedule };
    if (exists) {
      delete nextSchedule[needId];
    } else {
      const tag = NEEDS_TAGS.find((t) => t.id === needId);
      nextSchedule[needId] = {
        days: [...WEEKDAYS],
        periods: tag ? [...tag.defaultSlots] : ['daytime'],
      };
    }

    setFormData((prev) => ({
      ...prev,
      selectedNeeds: newNeeds,
      slotNeeds: scheduleToSlotNeeds(newNeeds, nextSchedule),
    }));
    setSchedule(nextSchedule);
  };

  const handleBudgetChange = (budget: number) => {
    setFormData((prev) => ({ ...prev, monthlyBudget: budget }));
  };

  const nextStep = () => {
    if (currentStep < 5) {
      setDirection('fwd');
      setCurrentStep((prev) => prev + 1);
    } else {
      onSubmit(formData);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setDirection('back');
      setCurrentStep((prev) => prev - 1);
    }
  };

  const STEP_TITLES = [
    '要介護認定の区分',
    'ご本人の世帯状況',
    '困っていること',
    '発生する曜日・時間帯',
    '月に出せる金額',
  ];

  return (
    <div className="bg-white rounded-[24px] border-2 border-[#2D231E] overflow-hidden max-w-3xl mx-auto my-6 shadow-[4px_4px_0_#2D231E]">
      {/* ヘッダー */}
      <div className="px-5 sm:px-7 py-5 sm:py-6 border-b-2 border-[#2D231E] bg-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-[13px] font-bold text-[#B94716] tracking-wide">
              ステップ {currentStep} / 5
            </span>
            <h2 key={currentStep} className="text-2xl font-bold mt-1 text-[#2D231E] swap swap-tight">
              {STEP_TITLES[currentStep - 1]}
            </h2>
          </div>
          <button
            onClick={onLoadDemo}
            type="button"
            className="shrink-0 min-h-11 px-4 py-2 rounded-full border-2 border-[#2D231E] bg-[#FFF9F3] text-[#2D231E] hover:bg-[#FDE8DC] text-[13px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#9D3D12]"
          >
            入力例を読み込む
          </button>
        </div>

        {/* ステップ進捗（5分割セグメント） */}
        <div
          className="flex gap-2 mt-5"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={5}
          aria-valuenow={currentStep}
          aria-label={`ステップ ${currentStep} / 5`}
        >
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`h-2 flex-1 rounded-full transition-colors duration-300 ${
                step <= currentStep ? 'bg-[#ED6A2C]' : 'bg-[#F3E7DE]'
              }`}
            />
          ))}
        </div>
      </div>

      <div
        key={currentStep}
        className={`p-5 sm:p-7 md:p-8 min-h-[360px] bg-white swap ${direction === 'fwd' ? 'swap-fwd' : 'swap-back'}`}
      >
        {/* ---------------- Step 1: 要介護度 ---------------- */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <p className="text-[15px] leading-relaxed text-[#756A64]">
              ご本人が受けている介護認定を選んでください。まだ申請していない場合も選べます。
            </p>

            <div className="space-y-4">
              {CARE_LEVEL_GROUPS.map((group) => (
                <div key={group.label}>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-sm font-bold text-[#2D231E]">{group.label}</span>
                    {group.note && (
                      <span className="text-[13px] text-[#756A64]">{group.note}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.levels.map((level) => {
                      const isSelected = formData.careLevel === level;
                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() => handleCareLevelChange(level)}
                          aria-pressed={isSelected}
                          className={`press inline-flex min-h-11 items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 text-sm leading-tight transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#9D3D12] ${
                            isSelected
                              ? 'border-[#2D231E] bg-[#ED6A2C] text-[#2D231E] font-bold'
                              : 'border-[#2D231E] bg-[#FFF9F3] text-[#2D231E] hover:bg-[#FDE8DC] font-semibold'
                          }`}
                        >
                          {isSelected && <Check className="w-4 h-4 text-[#2D231E]" />}
                          {CARE_LEVEL_SHORT[level]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* 選択中の区分の説明のみを1行で表示 */}
            <div className="p-4 rounded-xl bg-[#FFF7F2] border-2 border-[#DCC8BB] text-sm text-[#756A64] leading-relaxed">
              {CARE_LEVEL_LIMITS[formData.careLevel].description}
            </div>
          </div>
        )}

        {/* ---------------- Step 2: 世帯状況 ---------------- */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <p className="text-[15px] leading-relaxed text-[#756A64]">
              同居家族の有無で、介護保険の生活援助が使えるかどうかが変わります。
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {HOUSEHOLDS.map((item) => {
                const isSelected = formData.householdType === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleHouseholdChange(item.id)}
                    aria-pressed={isSelected}
                    className={`press min-h-[116px] text-left p-4 rounded-2xl border-2 transition-colors flex items-start gap-3 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#9D3D12] ${
                      isSelected
                        ? 'border-[#2D231E] bg-[#ED6A2C]'
                        : 'border-[#2D231E] bg-[#FFF9F3] hover:bg-[#FDE8DC]'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 mt-0.5 shrink-0 ${
                        isSelected ? 'text-[#2D231E]' : 'text-[#B94716]'
                      }`}
                    />
                    <span>
                      <span className="flex items-center gap-1.5">
                        <span
                          className={`font-bold text-sm ${
                            isSelected ? 'text-[#2D231E]' : 'text-[#2D231E]'
                          }`}
                        >
                          {item.title}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-[#2D231E]" />}
                      </span>
                      <span className={`block text-[13px] leading-relaxed mt-1 ${
                        isSelected ? 'text-[#2D231E]/80' : 'text-[#756A64]'
                      }`}>
                        {item.desc}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ---------------- Step 3: 困りごと（種類別） ---------------- */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[15px] leading-relaxed text-[#756A64]">
                負担に感じていることを選んでください（複数可）。
              </p>
              <span className="shrink-0 text-[13px] font-bold text-[#B94716] tabular-nums">
                {formData.selectedNeeds.length} 件選択中
              </span>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
              {NEEDS_CATEGORIES.map((cat) => {
                const tags = NEEDS_TAGS.filter((t) => t.category === cat.key);
                if (tags.length === 0) return null;
                const selectedCount = tags.filter((t) =>
                  formData.selectedNeeds.includes(t.id)
                ).length;

                return (
                  <div key={cat.key}>
                    <div className="flex items-baseline gap-2 mb-2 pb-2 border-b-2 border-[#F3E7DE]">
                      <span className="text-sm font-bold text-[#2D231E]">{cat.label}</span>
                      <span className="text-[13px] text-[#756A64]">{cat.hint}</span>
                      {selectedCount > 0 && (
                        <span className="ml-auto text-[13px] font-bold text-[#B94716] tabular-nums">
                          {selectedCount}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => {
                        const isSelected = formData.selectedNeeds.includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            title={tag.description}
                            onClick={() => toggleNeed(tag.id)}
                            aria-pressed={isSelected}
                            className={`press-sm inline-flex min-h-11 items-center gap-1.5 px-3.5 py-2.5 rounded-xl border-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#9D3D12] ${
                              isSelected
                                ? 'border-[#2D231E] bg-[#ED6A2C] text-[#2D231E] font-bold'
                                : 'border-[#2D231E] bg-[#FFF9F3] text-[#2D231E] hover:bg-[#FDE8DC] font-semibold'
                            }`}
                          >
                            {isSelected && <Check className="w-4 h-4 text-[#2D231E]" />}
                            {tag.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ---------------- Step 4: タスクごとの発生タイミング ---------------- */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <p className="text-[15px] leading-relaxed text-[#756A64]">
              困りごとごとに、発生する曜日と時間帯を選んでください。次の画面で、この予定にサービスを自動で当てはめた結果が表示されます。
            </p>

            {formData.selectedNeeds.length === 0 ? (
              <div className="p-6 rounded-2xl border-2 border-dashed border-[#2D231E] bg-[#FFF9F3] text-center text-sm text-[#756A64]">
                困りごとがまだ選ばれていません。「戻る」から選択してください。
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {formData.selectedNeeds.map((needId) => {
                  const tag = NEEDS_TAGS.find((t) => t.id === needId);
                  if (!tag) return null;
                  const timing = schedule[needId] ?? { days: [], periods: [] };
                  // 重なりで上書きされた分を除いた、実際に確保できたコマ数
                  const actual = Object.values(formData.slotNeeds).filter(
                    (v) => v === needId
                  ).length;
                  const isWeekdays =
                    timing.days.length === 5 && WEEKDAYS.every((d) => timing.days.includes(d));
                  const isWeekend =
                    timing.days.length === 2 && WEEKEND.every((d) => timing.days.includes(d));
                  const isEveryDay = timing.days.length === 7;
                  // 選んだ数と、実際に確保できた数の差＝他の困りごとに取られた分
                  const requested = timing.days.length * timing.periods.length;
                  const takenByOthers = Math.max(0, requested - actual);

                  return (
                    <div
                      key={needId}
                      className="rounded-2xl border-2 border-[#2D231E] overflow-hidden"
                    >
                      <div className="px-4 py-3 bg-[#FFF7F2] border-b-2 border-[#2D231E] flex items-center justify-between gap-3">
                        <span className="text-[15px] font-bold text-[#2D231E] truncate">
                          {tag.name}
                        </span>
                        <span
                          key={actual}
                          className={`swap swap-tight shrink-0 text-[13px] font-bold px-2.5 py-1 rounded-full tabular-nums ${
                            actual > 0
                              ? 'bg-[#FDE8DC] text-[#9D3D12] border-2 border-[#B94716]'
                              : 'bg-[#EEE9E5] text-[#756A64] border-2 border-[#756A64]'
                          }`}
                        >
                          週 {actual} コマ
                        </span>
                      </div>

                      <div className="px-4 py-4 space-y-3.5">
                        {/* 曜日 */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[13px] font-semibold text-[#756A64] w-12 shrink-0">曜日</span>
                          <button
                            type="button"
                            aria-pressed={isEveryDay}
                            onClick={() => setTaskDays(needId, ALL_DAYS)}
                            className={`min-h-11 px-3 py-2 rounded-lg border-2 text-[13px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#9D3D12] ${
                              isEveryDay
                                ? 'border-[#2D231E] bg-[#ED6A2C] text-[#2D231E]'
                                : 'border-[#2D231E] bg-[#FFF9F3] text-[#2D231E] hover:bg-[#FDE8DC]'
                            }`}
                          >
                            毎日
                          </button>
                          <button
                            type="button"
                            aria-pressed={isWeekdays}
                            onClick={() => setTaskDays(needId, WEEKDAYS)}
                            className={`min-h-11 px-3 py-2 rounded-lg border-2 text-[13px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#9D3D12] ${
                              isWeekdays
                                ? 'border-[#2D231E] bg-[#ED6A2C] text-[#2D231E]'
                                : 'border-[#2D231E] bg-[#FFF9F3] text-[#2D231E] hover:bg-[#FDE8DC]'
                            }`}
                          >
                            平日
                          </button>
                          <button
                            type="button"
                            aria-pressed={isWeekend}
                            onClick={() => setTaskDays(needId, WEEKEND)}
                            className={`min-h-11 px-3 py-2 rounded-lg border-2 text-[13px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#9D3D12] ${
                              isWeekend
                                ? 'border-[#2D231E] bg-[#ED6A2C] text-[#2D231E]'
                                : 'border-[#2D231E] bg-[#FFF9F3] text-[#2D231E] hover:bg-[#FDE8DC]'
                            }`}
                          >
                            土日
                          </button>
                          <span className="w-px h-6 bg-[#DCC8BB] mx-0.5" />
                          {DAYS_OF_WEEK.map((d) => {
                            const on = timing.days.includes(d.key);
                            return (
                              <button
                                key={d.key}
                                type="button"
                                aria-pressed={on}
                                aria-label={d.label}
                                onClick={() => toggleTaskDay(needId, d.key)}
                                className={`press-sm w-11 h-11 rounded-lg border-2 text-[13px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#9D3D12] ${
                                  on
                                    ? 'border-[#2D231E] bg-[#ED6A2C] text-[#2D231E]'
                                    : 'border-[#2D231E] bg-[#FFF9F3] text-[#2D231E] hover:bg-[#FDE8DC]'
                                }`}
                              >
                                {d.shortLabel}
                              </button>
                            );
                          })}
                        </div>

                        {/* 時間帯 */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[13px] font-semibold text-[#756A64] w-12 shrink-0">時間帯</span>
                          {TIME_PERIODS.map((tp) => {
                            const on = timing.periods.includes(tp.key);
                            return (
                              <button
                                key={tp.key}
                                type="button"
                                aria-pressed={on}
                                onClick={() => toggleTaskPeriod(needId, tp.key)}
                                className={`press-sm min-h-11 px-3 py-2 rounded-lg border-2 text-[13px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#9D3D12] ${
                                  on
                                    ? 'border-[#2D231E] bg-[#ED6A2C] text-[#2D231E]'
                                    : 'border-[#2D231E] bg-[#FFF9F3] text-[#2D231E] hover:bg-[#FDE8DC]'
                                }`}
                              >
                                {tp.label}
                                <span className="ml-1 font-normal text-[13px] opacity-80">
                                  {tp.timeRange}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {takenByOthers > 0 && (
                          <p className="text-[13px] leading-relaxed text-[#9A571B]">
                            選んだ {requested} コマのうち {takenByOthers} コマは、他の困りごとと重なっているためそちらが優先されています。
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center gap-2.5 p-4 rounded-xl bg-[#FFF7F2] border-2 border-[#DCC8BB] text-sm text-[#756A64]">
              <CalendarDays className="w-5 h-5 text-[#B94716] shrink-0" />
              <span>
                1週間で
                <strong className="text-[#2D231E] tabular-nums mx-1">
                  {Object.values(formData.slotNeeds).filter(Boolean).length}
                </strong>
                コマの困りごとが登録されています（最大28コマ）。同じ枠が重なった場合は、あとから選んだ困りごとが優先されます。
              </span>
            </div>
          </div>
        )}

        {/* ---------------- Step 5: 予算 ---------------- */}
        {currentStep === 5 && (
          <div className="space-y-5">
            <p className="text-[15px] leading-relaxed text-[#756A64]">
              保険外サービス（自費・シルバー人材・互助）に月々出せる上限を設定してください。
            </p>
            <div className="bg-[#FFF9F3] p-6 rounded-2xl border-2 border-[#2D231E] text-center space-y-4">
              <span className="text-sm font-semibold text-[#756A64]">月額の自己負担 上限</span>
              <div className="text-4xl font-bold text-[#B94716] tabular-nums">
                {formData.monthlyBudget.toLocaleString()}
                <span className="text-lg font-normal text-[#756A64] ml-1">円 / 月</span>
              </div>

              <input
                type="range"
                min="0"
                max="200000"
                step="5000"
                aria-label="月額予算"
                value={formData.monthlyBudget}
                onChange={(e) => handleBudgetChange(Number(e.target.value))}
                style={{ '--range-progress': `${(formData.monthlyBudget / 200000) * 100}%` } as React.CSSProperties}
                className="w-full h-11 cursor-pointer"
              />

              <div className="flex justify-between text-[13px] text-[#756A64] font-medium tabular-nums">
                <span>0円</span>
                <span>5万円</span>
                <span>10万円</span>
                <span>15万円</span>
                <span>20万円</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#FDE8DC] border-2 border-[#B94716] text-sm text-[#2D231E] leading-relaxed">
              <strong>0円でも大丈夫です。</strong>{' '}
              地域のボランティア、社協のサロン、自治体の助成（おむつ支給など）だけで組める案も探します。
            </div>
          </div>
        )}
      </div>

      {/* フッター */}
      <div className="bg-[#FFF7F2] border-t-2 border-[#2D231E] px-5 sm:px-7 py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={prevStep}
          disabled={currentStep === 1}
          className={`min-h-11 flex items-center justify-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#9D3D12] ${
            currentStep === 1
              ? 'text-[#B7AAA2] cursor-not-allowed'
              : 'text-[#2D231E] hover:bg-[#FDE8DC]'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          戻る
        </button>

        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => onSubmit(formData)}
            className="min-h-11 px-3 text-[13px] font-semibold text-[#756A64] hover:text-[#2D231E] underline rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#9D3D12]"
          >
            入力を省略して結果を見る
          </button>

          <button
            type="button"
            onClick={nextStep}
            className="press lift min-h-12 flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl border-2 border-[#2D231E] bg-[#C4511A] hover:bg-[#9D3D12] text-white font-bold text-sm transition-colors shadow-[2px_2px_0_#2D231E] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#9D3D12]"
          >
            {currentStep === 5 ? 'サービスを当てはめる' : '次へ'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
