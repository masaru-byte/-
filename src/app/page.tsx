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

import React, { useState, useMemo } from 'react';
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
import { Share2, Printer, Edit3, HelpCircle } from 'lucide-react';

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

  // 予算スライダー変更（即時再割り当て）
  const handleBudgetChange = (newBudget: number) => {
    setMonthlyBudget(newBudget);
    setCurrentSlots(buildOptimizedSlots(userInput, newBudget));
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

  // 印刷ダイアログの起動
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 selection:bg-orange-500 selection:text-white">
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
                <section className="max-w-2xl mx-auto text-center pt-14 sm:pt-20 pb-10">
                  <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 leading-snug">
                    <span className="inline-block">介護に使っている時間、</span>
                    <span className="inline-block">数えたことはありますか？</span>
                  </h1>
                  <p className="mt-5 text-base sm:text-lg text-stone-600 leading-relaxed text-balance">
                    要介護度と困りごとを入れるだけで、1週間の介護タイムラインを作成。
                    介護保険で足りない部分を埋める地域のサービスと、その料金がわかります。
                  </p>

                  <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsWizardOpen(true)}
                      className="w-full sm:w-auto px-8 h-12 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-base transition-colors"
                    >
                      はじめる（約1分）
                    </button>
                    <button
                      type="button"
                      onClick={handleLoadDemo}
                      className="w-full sm:w-auto px-8 h-12 rounded-xl border border-stone-300 hover:bg-white text-stone-700 font-semibold text-base transition-colors"
                    >
                      入力例で見てみる
                    </button>
                  </div>

                  <ol className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
                    {[
                      { n: '1', t: '状況を入力', d: '要介護度・世帯・困りごとを選ぶだけ。約1分で終わります。' },
                      { n: '2', t: 'タイムラインが完成', d: '1週間28マスで「誰がいつ支えているか」が見えます。' },
                      { n: '3', t: 'サービスと料金を確認', d: '予算内で任せられるサービスと月額がその場でわかります。' },
                    ].map((step) => (
                      <li key={step.n} className="flex gap-3">
                        <span className="w-7 h-7 rounded-full bg-orange-100 text-orange-700 font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">
                          {step.n}
                        </span>
                        <div>
                          <div className="font-bold text-sm text-stone-900">{step.t}</div>
                          <p className="mt-1 text-[13px] text-stone-500 leading-relaxed">{step.d}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>
              ) : (
                <>
                  {/* 結論サマリー（最初に答えを見せる） */}
                  <MetricsCards
                    metrics={currentMetrics}
                    initialFamilyHours={initialFamilyHours}
                  />

                  {/* 条件と予算（コンパクトな1枚） */}
                  <div className="bg-white rounded-2xl border border-stone-200 px-5 sm:px-6 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-stone-600 min-w-0">
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
                          className="w-10 h-10 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 flex items-center justify-center transition-colors"
                        >
                          <Share2 className="w-4.5 h-4.5" />
                        </button>
                        <button
                          type="button"
                          onClick={handlePrint}
                          aria-label="A4で印刷"
                          title="印刷"
                          className="w-10 h-10 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 flex items-center justify-center transition-colors"
                        >
                          <Printer className="w-4.5 h-4.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsWizardOpen(true)}
                          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                          条件を変更
                        </button>
                      </div>
                    </div>

                    {/* 予算 */}
                    <div className="mt-4 pt-4 border-t border-stone-100">
                      <div className="flex items-baseline justify-between gap-3 mb-1.5">
                        <label htmlFor="budget-range" className="text-[13px] text-stone-500">
                          月の予算 —— 動かすと組み合わせを作り直します
                        </label>
                        <div className="flex items-baseline gap-3 shrink-0">
                          <span className="text-lg font-bold text-stone-900 tabular-nums">
                            ¥{monthlyBudget.toLocaleString()}
                          </span>
                          <button
                            type="button"
                            onClick={handleResetAssignments}
                            className="text-[12px] text-stone-400 hover:text-orange-700 underline underline-offset-2"
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
                        className="w-full h-6 cursor-pointer"
                      />
                      <div className="flex justify-between text-[11px] text-stone-400 tabular-nums mt-1">
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
      />

      {/* 共有モーダル */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />

      {/* 免責事項・フッター（全画面共通） */}
      <footer className="bg-white border-t border-stone-200 py-6 px-4 text-center text-xs text-stone-500 space-y-2 no-print">
        <div className="max-w-4xl mx-auto flex items-center justify-center space-x-2 text-stone-600 font-semibold">
          <HelpCircle className="w-4 h-4 text-orange-600" />
          <span>免責事項 ＆ 掲載基準について</span>
        </div>
        <p className="max-w-3xl mx-auto leading-relaxed text-stone-400 text-[11px]">
          本システムで試算される金額・介護保険給付・サービス利用可否は目安であり、個別の所得状況や身体状況により異なります。
          実際のケアプラン作成や利用にあたっては、必ず担当ケアマネジャー、地域包括支援センター、または各提供事業者にご相談ください。
          掲載されているサービス情報は、広告費や掲載料による順位優遇を行わない公平な基準でAI構造化および人手承認を行っています。
        </p>
        <div className="pt-2 text-[11px] text-stone-400">
          © 2026 けあしる - 介護の「見えない時間」可視化 × 保険外サービス横断検索
        </div>
      </footer>
    </div>
  );
}
