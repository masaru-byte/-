/**
 * けあしる メインページ（App Router）
 * 
 * 介護の「見えない時間」可視化 × 保険外サービス横断検索
 * 
 * - 5ステップ入力フォーム / 入力例のワンクリック読み込み
 * - 28スロット週次タイムライン（0.35秒トランジション）
 * - 「サービスを当てはめる」Before/After 切り替え
 * - リアルタイム予算スライダー（貪欲法最適化）
 * - 3大指標の同時カウントアップ
 * - スロット詳細モーダル（出典・原文抜粋・差し替え・担当者メモ）
 * - 自治体ダッシュボード ＆ サービス収集・承認コンソール
 * - A4 1枚 PDF印刷ビュー
 */

'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useReveal } from '@/hooks/useReveal';
import {
  CARE_LEVEL_LIMITS,
  DEMO_SAMPLE_INPUT,
} from '@/constants/careConstants';
import { ALL_SERVICES } from '@/data/servicesSeed';
import { ActiveTab, Header } from '@/components/Header';
import { InputWizard } from '@/components/InputWizard';
import { MetricsCards } from '@/components/MetricsCards';
import { TimelineGrid } from '@/components/TimelineGrid';
import { SlotDetailModal } from '@/components/SlotDetailModal';
import { RestrictionGuide } from '@/components/RestrictionGuide';
import { ShareModal } from '@/components/ShareModal';
import { PrintView } from '@/components/PrintView';
import { GovDashboard } from '@/components/GovDashboard';
import { ServicePlanList } from '@/components/ServicePlanList';
import { AdminPipeline } from '@/components/AdminPipeline';
import {
  Service,
  TimelineSlot,
  UserInputData,
} from '@/types';
import {
  generateInitialTimeline,
  optimizeTimeline,
  calculateMetrics,
} from '@/utils/timelineEngine';
import { Share2, Printer, Edit3, HelpCircle, Clock3, ArrowRight } from 'lucide-react';

/** 入力条件と予算から、サービスを当てはめ済みのタイムラインを組み立てる */
function buildOptimizedSlots(input: UserInputData, budget: number): TimelineSlot[] {
  const base = generateInitialTimeline(input);
  return optimizeTimeline(
    base,
    input.careLevel,
    input.householdType,
    budget,
    ALL_SERVICES
  ).optimizedSlots;
}

export default function HomePage() {
  // ナビゲーションタブ
  const [activeTab, setActiveTab] = useState<ActiveTab>('timeline');

  // 入力フォームデータ（初期値はデモサンプル）
  const [userInput, setUserInput] = useState<UserInputData>(DEMO_SAMPLE_INPUT);
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  // 初回訪問かどうか（false の間はランディングを表示する）
  const [hasStarted, setHasStarted] = useState<boolean>(false);

  // タイムライン状態
  const [monthlyBudget, setMonthlyBudget] = useState<number>(userInput.monthlyBudget);
  const [activeSlot, setActiveSlot] = useState<TimelineSlot | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

  // 初期スロット（Before状態）
  const initialSlots = useMemo(() => {
    return generateInitialTimeline(userInput);
  }, [userInput]);

  // 現在表示されているスロット（最初からサービスを当てはめた状態で始める）
  const [currentSlots, setCurrentSlots] = useState<TimelineSlot[]>(
    () => buildOptimizedSlots(DEMO_SAMPLE_INPUT, DEMO_SAMPLE_INPUT.monthlyBudget)
  );

  // 指標
  const currentMetrics = useMemo(() => {
    return calculateMetrics(initialSlots, currentSlots, userInput.careLevel);
  }, [initialSlots, currentSlots, userInput.careLevel]);

  // 初期家族時間
  const initialFamilyHours = useMemo(() => {
    return initialSlots.reduce((sum, s) => sum + (s.needsTagId ? s.effectiveHours : 0), 0);
  }, [initialSlots]);

  // 予算スライダーを操作している最中かどうか（動きの速度を切り替えるために使う）
  const [isBudgetLive, setIsBudgetLive] = useState(false);
  const liveTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (liveTimer.current) window.clearTimeout(liveTimer.current);
  }, []);

  // 予算スライダー変更（即時再割り当て）
  const handleBudgetChange = (newBudget: number) => {
    setMonthlyBudget(newBudget);
    setCurrentSlots(buildOptimizedSlots(userInput, newBudget));

    setIsBudgetLive(true);
    if (liveTimer.current) window.clearTimeout(liveTimer.current);
    liveTimer.current = window.setTimeout(() => setIsBudgetLive(false), 420);
  };

  // 手動調整をやめて、最適な割り当てに戻す
  const handleResetAssignments = () => {
    setCurrentSlots(buildOptimizedSlots(userInput, monthlyBudget));
  };

  // スロットの手動サービス変更
  const handleSelectServiceForSlot = (service: Service | null) => {
    if (!activeSlot) return;

    setCurrentSlots((prev) =>
      prev.map((s) => {
        if (s.id === activeSlot.id) {
          if (!service) {
            return {
              ...s,
              assignedService: undefined,
              state: 'family',
              cost: 0,
            };
          } else {
            return {
              ...s,
              assignedService: service,
              state: service.scheme === 'insurance' ? 'insurance' : 'paid',
              cost: service.price * 4.33,
            };
          }
        }
        return s;
      })
    );

    setActiveSlot(null);
  };

  /**
   * この枠の予定（困りごと）を変更する。null で空き枠に戻す。
   * 予定が変わると必要時間そのものが変わるため、割り当てを計算し直す。
   * 担当者メモだけは利用者が手で書いたものなので引き継ぐ。
   */
  const handleChangeNeedForSlot = (needId: string | null) => {
    if (!activeSlot) return;

    const nextInput: UserInputData = {
      ...userInput,
      slotNeeds: { ...userInput.slotNeeds, [activeSlot.id]: needId },
      selectedNeeds:
        needId && !userInput.selectedNeeds.includes(needId)
          ? [...userInput.selectedNeeds, needId]
          : userInput.selectedNeeds,
    };

    setUserInput(nextInput);

    const rebuilt = buildOptimizedSlots(nextInput, monthlyBudget);
    setCurrentSlots((prev) =>
      rebuilt.map((fresh) => {
        const before = prev.find((s) => s.id === fresh.id);
        return before?.assignedPerson
          ? { ...fresh, assignedPerson: before.assignedPerson }
          : fresh;
      })
    );

    // 予定を入れた直後は、その枠の候補をそのまま見せたいので開いたままにする
    setActiveSlot(
      needId ? rebuilt.find((sl) => sl.id === activeSlot.id) ?? null : null
    );
  };

  // 担当者メモの更新（ブラウザ内保持）
  const handleUpdatePerson = (personName: string) => {
    if (!activeSlot) return;

    setCurrentSlots((prev) =>
      prev.map((s) => (s.id === activeSlot.id ? { ...s, assignedPerson: personName } : s))
    );

    setActiveSlot((prev) => (prev ? { ...prev, assignedPerson: personName } : null));
  };

  // 入力例の読み込み
  const handleLoadDemo = () => {
    setUserInput(DEMO_SAMPLE_INPUT);
    setMonthlyBudget(DEMO_SAMPLE_INPUT.monthlyBudget);
    setIsWizardOpen(false);
    setActiveTab('timeline');
    setHasStarted(true);
    setCurrentSlots(buildOptimizedSlots(DEMO_SAMPLE_INPUT, DEMO_SAMPLE_INPUT.monthlyBudget));
  };

  // ウィザード完了時：サービスを当てはめた状態のタイムラインへ進む
  const handleWizardSubmit = (newData: UserInputData) => {
    setUserInput(newData);
    setMonthlyBudget(newData.monthlyBudget);
    setIsWizardOpen(false);
    setHasStarted(true);
    setCurrentSlots(buildOptimizedSlots(newData, newData.monthlyBudget));
  };

  // ランディングの登場シーケンス（ファーストビューなので即時発火）
  const landing = useReveal<HTMLElement>({ immediate: true });

  // 印刷ダイアログの起動
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* グローバルヘッダー */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onHome={() => {
          setActiveTab('timeline');
          setIsWizardOpen(false);
        }}
      />

      {/* 印刷専用レイアウト（Ctrl+P時のみレンダリング） */}
      <PrintView
        slots={currentSlots}
        metrics={currentMetrics}
        careLevel={userInput.careLevel}
        householdType={userInput.householdType}
      />

      {/* メインコンテンツ */}
      <main className="flex-1 pb-16 no-print">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
          {/* タブ1: タイムライン画面 */}
          {activeTab === 'timeline' && (
            <div className="space-y-5">
              {isWizardOpen ? (
                <InputWizard
                  initialData={userInput}
                  onSubmit={handleWizardSubmit}
                  onLoadDemo={handleLoadDemo}
                />
              ) : !hasStarted ? (
                /* ---------------- ランディング（初回訪問） ---------------- */
                <section
                  {...landing.containerProps}
                  className={`max-w-5xl mx-auto pt-10 sm:pt-16 pb-12 ${landing.containerProps.className ?? ''}`}
                >
                  <div className="grid lg:grid-cols-[1.15fr_0.85fr] items-center gap-10 lg:gap-14">
                    <div className="text-center lg:text-left">
                      <span
                        {...landing.item(0)}
                        className={`inline-flex items-center rounded-full border-2 border-stone-900 bg-white px-4 py-2 text-sm font-bold text-orange-800 shadow-[0_3px_0_#251B17] ${landing.item(0).className}`}
                        style={{ ...landing.item(0).style, ['--rv-y' as string]: '12px', ['--rv-delay' as string]: '80ms' }}
                      >
                        家族のケア時間を、見えるかたちに
                      </span>

                      <h1 className="mt-7 text-4xl sm:text-5xl lg:text-[56px] font-extrabold tracking-[-0.04em] text-stone-900 leading-[1.28] text-balance">
                        <span
                          {...landing.item(1)}
                          className={`block ${landing.item(1).className}`}
                          style={{ ...landing.item(1).style, ['--rv-y' as string]: '16px', ['--rv-delay' as string]: '110ms' }}
                        >
                          介護に使っている時間、
                        </span>
                        <span
                          {...landing.item(2)}
                          className={`block text-orange-700 ${landing.item(2).className}`}
                          style={{ ...landing.item(2).style, ['--rv-y' as string]: '16px', ['--rv-delay' as string]: '150ms' }}
                        >
                          いっしょに整理しませんか？
                        </span>
                      </h1>

                      <p
                        {...landing.item(4)}
                        className={`mt-6 text-base sm:text-lg text-stone-600 leading-[1.9] text-balance ${landing.item(4).className}`}
                        style={{ ...landing.item(4).style, ['--rv-y' as string]: '10px', ['--rv-delay' as string]: '190ms' }}
                      >
                        5つの質問に答えるだけで、1週間のケア時間と、地域で頼れるサービスを整理します。
                        ご家族やケアマネジャーとの相談にもそのまま使えます。
                      </p>

                      <div
                        {...landing.item(6)}
                        className={`mt-8 flex flex-col sm:flex-row items-center lg:justify-start gap-4 ${landing.item(6).className}`}
                        style={{ ...landing.item(6).style, ['--rv-y' as string]: '10px', ['--rv-delay' as string]: '230ms' }}
                      >
                        <button
                          type="button"
                          onClick={() => setIsWizardOpen(true)}
                          className="press w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 h-14 rounded-2xl border-2 border-stone-900 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-base shadow-[0_5px_0_#251B17] active:translate-y-[3px] active:shadow-[0_2px_0_#251B17] transition-[background-color,transform,box-shadow]"
                        >
                          1分で見える化する
                          <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
                        </button>
                        <button
                          type="button"
                          onClick={handleLoadDemo}
                          className="press w-full sm:w-auto px-7 h-14 rounded-2xl border-2 border-stone-900 bg-white hover:bg-orange-50 text-stone-800 font-bold text-base transition-colors"
                        >
                          入力例を見てみる
                        </button>
                      </div>
                    </div>

                    <div
                      {...landing.item(3)}
                      className={`relative mx-auto w-full max-w-[360px] aspect-square ${landing.item(3).className}`}
                      style={{ ...landing.item(3).style, ['--rv-y' as string]: '12px', ['--rv-delay' as string]: '170ms' }}
                      aria-hidden="true"
                    >
                      <div className="absolute inset-4 rounded-[42px] border-[3px] border-stone-900 bg-orange-600 rotate-3 shadow-[8px_8px_0_#251B17]" />
                      <div className="absolute inset-10 rounded-[34px] border-[3px] border-stone-900 bg-white -rotate-3 flex flex-col items-center justify-center text-center px-8">
                        <span className="w-24 h-24 rounded-full bg-orange-100 border-[3px] border-stone-900 flex items-center justify-center text-orange-700">
                          <Clock3 className="w-12 h-12" strokeWidth={2.4} />
                        </span>
                        <span className="mt-6 text-2xl font-extrabold text-stone-900">あなたの時間を</span>
                        <span className="mt-1 text-xl font-extrabold text-orange-700">取り戻すお手伝い</span>
                      </div>
                      <span className="absolute top-0 right-3 w-12 h-12 rounded-full border-[3px] border-stone-900 bg-orange-100" />
                      <span className="absolute bottom-3 left-0 w-8 h-8 rounded-full border-[3px] border-stone-900 bg-white" />
                    </div>
                  </div>

                  <ol className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                    {[
                      { n: '1', t: '状況を入力', d: '要介護度・世帯・困りごとを選ぶだけ。約1分で終わります。' },
                      { n: '2', t: 'タイムラインが完成', d: '1週間28マスで「誰がいつ支えているか」が見えます。' },
                      { n: '3', t: 'サービスと料金を確認', d: '予算内で任せられるサービスと月額がその場でわかります。' },
                    ].map((step) => (
                      <li
                        key={step.n}
                        {...landing.item(5 + Number(step.n))}
                        className={`flex gap-4 rounded-3xl border-2 border-stone-900 bg-white p-5 shadow-[0_4px_0_rgba(37,27,23,0.16)] ${landing.item(5 + Number(step.n)).className}`}
                        style={{ ...landing.item(5 + Number(step.n)).style, ['--rv-y' as string]: '10px', ['--rv-delay' as string]: '250ms', ['--rv-step' as string]: '70ms' }}
                      >
                        <span className="w-10 h-10 rounded-full border-2 border-stone-900 bg-orange-100 text-orange-800 font-extrabold text-sm flex items-center justify-center shrink-0">
                          {step.n}
                        </span>
                        <div>
                          <div className="font-extrabold text-base text-stone-900">{step.t}</div>
                          <p className="mt-1.5 text-sm text-stone-600 leading-relaxed">{step.d}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>
              ) : (
                <>
                  <section className="rounded-[28px] border-2 border-stone-900 bg-orange-600 px-6 sm:px-8 py-6 text-white shadow-[0_5px_0_#251B17]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="inline-flex rounded-full border-2 border-white/80 px-3 py-1 text-[13px] font-extrabold tracking-wide">
                          あなたのケアプラン
                        </span>
                        <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold leading-snug">
                          1週間のケア時間と、頼れるサービスをまとめました
                        </h1>
                      </div>
                      <div className="shrink-0 w-16 h-16 rounded-full border-2 border-stone-900 bg-white text-orange-700 flex items-center justify-center shadow-[0_3px_0_#251B17]" aria-hidden="true">
                        <Clock3 className="w-8 h-8" strokeWidth={2.4} />
                      </div>
                    </div>
                  </section>

                  {/* 結論サマリー（最初に答えを見せる） */}
                  <MetricsCards
                    metrics={currentMetrics}
                    initialFamilyHours={initialFamilyHours}
                  />

                  {/* 条件と予算（コンパクトな1枚） */}
                  <div className="glass rounded-[28px] border-2 border-stone-900 px-5 sm:px-7 py-5 shadow-[0_4px_0_rgba(37,27,23,0.14)]">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm sm:text-base text-stone-600 min-w-0 leading-relaxed">
                        <span className="font-bold text-stone-900">
                          {CARE_LEVEL_LIMITS[userInput.careLevel].name}
                        </span>
                        <span className="mx-1.5 text-stone-300">・</span>
                        <span className="font-bold text-stone-900">
                          {userInput.householdType === 'living_together' && '同居家族あり'}
                          {userInput.householdType === 'single' && '独居'}
                          {userInput.householdType === 'elderly_only' && '高齢者のみ世帯'}
                          {userInput.householdType === 'long_distance' && '遠距離介護'}
                        </span>
                        <span className="mx-1.5 text-stone-300">・</span>
                        <span className="tabular-nums">
                          困りごと <span className="font-bold text-stone-900">{userInput.selectedNeeds.length}</span> 件
                        </span>
                      </p>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setIsShareModalOpen(true)}
                          aria-label="共有リンクを発行"
                          title="共有"
                          className="w-11 h-11 rounded-xl border-2 border-stone-200 text-stone-500 hover:text-orange-800 hover:bg-orange-50 hover:border-stone-900 flex items-center justify-center transition-colors"
                        >
                          <Share2 className="w-4.5 h-4.5" />
                        </button>
                        <button
                          type="button"
                          onClick={handlePrint}
                          aria-label="A4で印刷"
                          title="印刷"
                          className="w-11 h-11 rounded-xl border-2 border-stone-200 text-stone-500 hover:text-orange-800 hover:bg-orange-50 hover:border-stone-900 flex items-center justify-center transition-colors"
                        >
                          <Printer className="w-4.5 h-4.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsWizardOpen(true)}
                          className="inline-flex items-center gap-1.5 h-11 px-4 rounded-xl border-2 border-stone-900 bg-orange-600 hover:bg-orange-700 text-white text-sm font-extrabold shadow-[0_3px_0_#251B17] transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                          条件を変更
                        </button>
                      </div>
                    </div>

                    {/* 予算 */}
                    <div className="mt-5 pt-5 border-t-2 border-stone-200">
                      <div className="flex items-baseline justify-between gap-3 mb-1.5">
                        <label htmlFor="budget-range" className="micro-label">
                          月の予算 —— 動かすと組み合わせを作り直します
                        </label>
                        <div className="flex items-baseline gap-3 shrink-0">
                          <span
                            className="tint metric-num text-lg font-bold text-stone-900"
                            data-live={isBudgetLive ? 'true' : 'false'}
                          >
                            ¥{monthlyBudget.toLocaleString()}
                          </span>
                          <button
                            type="button"
                            onClick={handleResetAssignments}
                            className="min-h-11 px-2 text-[13px] font-bold text-stone-500 hover:text-orange-800 underline underline-offset-4"
                          >
                            おすすめに戻す
                          </button>
                        </div>
                      </div>

                      <input
                        id="budget-range"
                        type="range"
                        min="0"
                        max="200000"
                        step="5000"
                        value={monthlyBudget}
                        onChange={(e) => handleBudgetChange(Number(e.target.value))}
                        style={{ '--range-progress': `${(monthlyBudget / 200000) * 100}%` } as React.CSSProperties}
                        className="w-full h-11 cursor-pointer"
                      />
                      <div className="flex justify-between text-[13px] font-semibold text-stone-500 tabular-nums mt-1">
                        <span>0円</span>
                        <span>5万</span>
                        <span>10万</span>
                        <span>15万</span>
                        <span>20万</span>
                      </div>
                    </div>
                  </div>

                  {/* 28スロット週次ケアタイムライン */}
                  <TimelineGrid
                    slots={currentSlots}
                    onSlotClick={(slot) => setActiveSlot(slot)}
                    isLive={isBudgetLive}
                  />

                  {/* このプランで使うサービスの一覧 */}
                  <ServicePlanList
                    slots={currentSlots}
                    onSelectSlot={(slot) => setActiveSlot(slot)}
                  />

                  {/* 境界説明ガイド */}
                  <RestrictionGuide
                    selectedNeedIds={userInput.selectedNeeds}
                    householdType={userInput.householdType}
                    careLevel={userInput.careLevel}
                  />
                </>
              )}
            </div>
          )}

          {/* タブ2: 自治体ダッシュボード */}
          {activeTab === 'gov' && <GovDashboard />}

          {/* タブ3: AI収集＆承認管理 */}
          {activeTab === 'admin' && <AdminPipeline />}
        </div>
      </main>

      {/* スロット候補差し替えモーダル */}
      <SlotDetailModal
        slot={activeSlot}
        careLevel={userInput.careLevel}
        householdType={userInput.householdType}
        onClose={() => setActiveSlot(null)}
        onSelectService={handleSelectServiceForSlot}
        onUpdatePerson={handleUpdatePerson}
        onChangeNeed={handleChangeNeedForSlot}
      />

      {/* 共有モーダル */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />

      {/* 免責事項・フッター（全画面共通） */}
      <footer className="bg-stone-50 border-t-2 border-stone-900 py-8 px-4 text-center text-sm text-stone-600 space-y-3 no-print">
        <div className="max-w-4xl mx-auto flex items-center justify-center space-x-2 text-stone-600 font-semibold">
          <HelpCircle className="w-4 h-4 text-orange-600" />
          <span>免責事項 ＆ 掲載基準について</span>
        </div>
        <p className="max-w-3xl mx-auto leading-relaxed text-stone-500 text-[13px]">
          本システムで試算される金額・介護保険給付・サービス利用可否は目安であり、個別の所得状況や身体状況により異なります。
          実際のケアプラン作成や利用にあたっては、必ず担当ケアマネジャー、地域包括支援センター、または各提供事業者にご相談ください。
          掲載されているサービス情報は、広告費や掲載料による順位優遇を行わない公平な基準でAI構造化および人手承認を行っています。
        </p>
        <div className="pt-2 text-[13px] text-stone-500">
          © 2026 けあしる - 介護の「見えない時間」可視化 × 保険外サービス横断検索
        </div>
      </footer>
    </div>
  );
}
