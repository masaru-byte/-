/**
 * ランディング下部セクション
 *
 * 保険外サービス例3カード → 60%統計バンド → しくみ（3ステージ）→ フッターCTA
 * デザイン仕様（Redesign.dc.html）に対応。
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { SLOT_COLORS } from '@/utils/colors';

const INK = '#2D231E';
const CREAM = '#FFF8F3';
const PRIMARY = '#C4511A';
const SUB = '#8A7F76';

/* ---------- 保険外サービスの実例 ---------- */
const EXAMPLES = [
  { short: '庭の草むしり', price: '1時間 1,450円', provider: 'シルバー人材センター', d: 'M12 4v16' },
  { short: '部屋の掃除', price: '1時間 1,350円', provider: 'シルバー人材センター', d: 'M6 12h12' },
  { short: '病院での付き添い', price: '1時間 3,300円', provider: '便利屋ベンリー', d: 'M12 6v12M6 12h12' },
];

/* ---------- しくみ：3ステージ ---------- */
const STAGES = [
  { who: 'ご家族', title: '3つの質問に答える', caption: 'いまは、ほとんどの枠を家族が担っています' },
  { who: 'このサイト', title: '安い順に当てはめる', caption: '予算に収まる範囲で、色のついた枠が置き換わります' },
  { who: 'ケアマネジャー', title: 'リンクを開いて面談で使う', caption: '残った家族の枠が、そのまま相談すべき項目になります' },
];

/** 完成後の28マスの担い手（しくみ図の右側で使う） */
const FLOWPLAN: (keyof typeof SLOT_COLORS)[] = [
  'family', 'family', 'paid', 'family', 'family', 'paid', 'family',
  'insurance', 'paid', 'paid', 'insurance', 'paid', 'paid', 'paid',
  'family', 'insurance', 'family', 'family', 'insurance', 'family', 'family',
  'paid', 'paid', 'none', 'paid', 'none', 'paid', 'paid',
];

const LADDER = [
  { price: '0円', name: 'ゴミ出しボランティア', w: 14 },
  { price: '500円', name: '区の配食サービス', w: 30 },
  { price: '1,350円', name: 'シルバーの家事援助', w: 58 },
  { price: '3,300円', name: '院内付き添い', w: 88 },
];

const QDATA = [
  { k: '要介護度・世帯', v: '要介護2・同居' },
  { k: '困っていること', v: '9 件' },
  { k: '月に出せる金額', v: '25,000 円' },
];

/* しくみアニメの刻み（デザイン仕様の値） */
const QTICK = 70;      // 1ティックの長さ(ms)
const TPC = 2;         // 1文字あたりのティック数
const QPAUSE = 6;      // 行間の休止ティック
const S1_STEP = 7;     // ステージ1で1件採用するごとのティック
const S2_SEND = 17;    // ステージ2で共有が完了するティック

/** 各行のタイプ開始ティック */
const Q_STARTS = QDATA.reduce<number[]>((acc, r, i) => {
  const prev = i === 0 ? 0 : acc[i - 1] + QDATA[i - 1].v.length * TPC + QPAUSE;
  acc.push(prev);
  return acc;
}, []);
const Q_TOTAL = Q_STARTS[QDATA.length - 1] + QDATA[QDATA.length - 1].v.length * TPC + QPAUSE;
const STAGE_TICKS = [Q_TOTAL, LADDER.length * S1_STEP, S2_SEND + 16];

/** 画面に入ったら一度だけ true になる */
function useInView<T extends HTMLElement>(threshold = 0.3) {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // 同期 setState を避けるため、判定は必ずコールバック内で行う
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const raf = requestAnimationFrame(() => setSeen(true));
      return () => cancelAnimationFrame(raf);
    }

    const ob = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setSeen(true);
            ob.unobserve(e.target);
          }
        }
      },
      { threshold }
    );
    ob.observe(node);
    return () => ob.disconnect();
  }, [threshold]);

  return [ref, seen] as const;
}

interface LandingSectionsProps {
  onStart: () => void;
}

export const LandingSections: React.FC<LandingSectionsProps> = ({ onStart }) => {
  const [statRef, statSeen] = useInView<HTMLElement>(0.4);
  const [stage, setStage] = useState(0);
  const [tick, setTick] = useState(0);
  // 判定は初回レンダー時に一度だけ（エフェクト内の同期 setState を避ける）
  const [reduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  /**
   * ステージ内をティックで進め、終端に達したら次のステージへ。
   * 動きを減らす設定では、各ステージの完成形を静止表示する。
   */
  useEffect(() => {
    if (reduced) {
      // 静止表示。完成形まで一度で進める
      const raf = requestAnimationFrame(() => setTick(STAGE_TICKS[stage]));
      return () => cancelAnimationFrame(raf);
    }
    const id = window.setInterval(() => {
      setTick((t) => {
        if (t < STAGE_TICKS[stage]) return t + 1;
        // 終端で少し置いてから次へ
        if (t < STAGE_TICKS[stage] + 12) return t + 1;
        setStage((sg) => (sg + 1) % STAGES.length);
        return 0;
      });
    }, QTICK);
    return () => window.clearInterval(id);
  }, [stage, reduced]);

  const pickStage = (i: number) => {
    setStage(i);
    setTick(0);
  };

  /* ---- 派生値 ---- */
  // ステージ1: 安い順に何件採用できたか
  const adopted = stage === 0 ? 0 : stage === 1 ? Math.min(LADDER.length, Math.floor(tick / S1_STEP)) : LADDER.length;
  // ステージ2: 共有が完了したか
  const sent = stage === 2 && tick >= S2_SEND;
  // 左の週表で色がつく枠の数（採用数に応じて増える）
  const litRatio = stage === 0 ? 0 : stage === 1 ? adopted / LADDER.length : 1;

  return (
    <div style={{ background: CREAM, color: INK }}>
      {/* ============ 保険外サービス例 ============ */}
      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '112px 32px 0' }}>
        <p style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, letterSpacing: '0.16em', color: '#B04512' }}>
          保険外サービス
        </p>
        <h2
          className="font-display"
          style={{ marginTop: 16, textAlign: 'center', fontSize: 'clamp(26px,3.4vw,40px)', fontWeight: 900, letterSpacing: '-0.03em' }}
        >
          介護保険では、頼めません
        </h2>
        <div
          style={{
            marginTop: 48,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))',
            gap: 20,
          }}
        >
          {EXAMPLES.map((e) => (
            <div
              key={e.short}
              style={{
                border: `2px solid ${INK}`,
                borderRadius: 16,
                background: '#fff',
                padding: '34px 30px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 60, height: 60, borderRadius: 15, background: '#FDE8DC',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="8" />
                  <path d={e.d} />
                </svg>
              </span>
              <div style={{ marginTop: 24, fontSize: 21, fontWeight: 700, lineHeight: 1.5 }}>{e.short}</div>
              <div
                className="font-display"
                style={{ marginTop: 12, fontSize: 32, fontWeight: 900, color: PRIMARY, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}
              >
                {e.price}
              </div>
              <div style={{ marginTop: 'auto', paddingTop: 20, fontSize: 13, color: SUB }}>{e.provider}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ 60%統計バンド ============ */}
      <section ref={statRef} style={{ maxWidth: 1180, margin: '0 auto', padding: '104px 32px 0' }}>
        <div
          style={{
            border: `2px solid ${INK}`,
            borderRadius: 20,
            background: '#FDE8DC',
            padding: '52px 48px',
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: 52,
            alignItems: 'center',
          }}
        >
          <div
            className="font-display"
            style={{ fontSize: 'clamp(76px,10vw,140px)', fontWeight: 900, color: PRIMARY, lineHeight: 0.86, fontVariantNumeric: 'tabular-nums' }}
          >
            60<span style={{ fontSize: '0.42em' }}>%</span>
          </div>
          <div>
            <p style={{ fontSize: 'clamp(19px,2.3vw,27px)', fontWeight: 700, lineHeight: 1.7 }}>
              使ったことがない人のうち、
              <br />
              「知っていたら使いたかった」
            </p>
            <div style={{ marginTop: 26, height: 14, borderRadius: 999, background: '#F4D3B9', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  borderRadius: 999,
                  background: PRIMARY,
                  width: statSeen ? '60%' : '0%',
                  transition: 'width 1.5s cubic-bezier(.22,1,.36,1) .25s',
                }}
              />
            </div>
            <p style={{ marginTop: 18, fontSize: 12, lineHeight: 1.8, color: SUB }}>
              出典：介護ポストセブン「介護保険外サービス、未利用77％でも将来的必要性は61％【利用実態調査】」
            </p>
          </div>
        </div>
      </section>

      {/* ============ しくみ ============ */}
      <section style={{ background: INK, color: '#F6F0EA', marginTop: 112 }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '96px 32px' }}>
          <p style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, letterSpacing: '0.16em', color: '#D98A55' }}>
            しくみ
          </p>
          <h2
            className="font-display"
            style={{ marginTop: 16, textAlign: 'center', fontSize: 'clamp(26px,3.4vw,40px)', fontWeight: 900, letterSpacing: '-0.03em' }}
          >
            面談の材料になるまで
          </h2>

          {/* ステージ切替 */}
          <div style={{ marginTop: 52, display: 'flex', alignItems: 'stretch', justifyContent: 'center' }}>
            {STAGES.map((s, i) => (
              <button
                key={s.title}
                type="button"
                onClick={() => pickStage(i)}
                aria-current={stage === i ? 'step' : undefined}
                style={{
                  flex: 1,
                  maxWidth: 280,
                  padding: '20px 18px 22px',
                  borderTop: `3px solid ${stage === i ? PRIMARY : '#4A3E37'}`,
                  opacity: stage === i ? 1 : 0.34,
                  transition: 'opacity .45s ease, border-color .45s ease',
                  textAlign: 'left',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      width: 26, height: 26, borderRadius: 999,
                      background: stage === i ? PRIMARY : '#4A3E37',
                      color: '#fff', fontSize: 12, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, transition: 'background-color .45s ease',
                    }}
                  >
                    {i + 1}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: '#A79A90' }}>{s.who}</span>
                </span>
                <span style={{ display: 'block', marginTop: 14, fontSize: 'clamp(17px,1.8vw,21px)', fontWeight: 700, lineHeight: 1.5 }}>
                  {s.title}
                </span>
              </button>
            ))}
          </div>

          {/* パネル：左=週表 / 右=ステージ別の内容 */}
          <div
            style={{
              marginTop: 36,
              border: '2px solid #4A3E37',
              borderRadius: 20,
              background: '#241C18',
              padding: 44,
              display: 'grid',
              // ステージ2以外はコネクタを畳んで、左右2枚だけを見せる
              gridTemplateColumns: stage === 2 ? 'minmax(0,1fr) 56px minmax(0,1fr)' : 'minmax(0,1fr) 0px minmax(0,1fr)',
              gap: stage === 2 ? 20 : 52,
              alignItems: 'center',
              minHeight: 432,
              transition: 'grid-template-columns .9s cubic-bezier(.22,1,.36,1), gap .9s cubic-bezier(.22,1,.36,1)',
            }}
          >
            {/* ---------- 左：週表 ---------- */}
            <div>
              <div
                style={{
                  border: `2px solid ${stage === 2 ? '#ED6A2C' : '#4A3E37'}`,
                  borderRadius: 12,
                  background: '#2D231E',
                  padding: 14,
                  transition: 'border-color .6s ease',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', gap: 8 }}>
                  {FLOWPLAN.map((k, i) => {
                    // 採用が進むほど、左から順に本来の色へ変わる
                    const lit = i / FLOWPLAN.length < litRatio;
                    const shown = k === 'none' ? 'none' : lit ? k : 'family';
                    const tok = SLOT_COLORS[shown];
                    return (
                      <div
                        key={i}
                        style={{
                          height: 30,
                          borderRadius: 8,
                          background: tok.bgHex,
                          border: `2px ${shown === 'none' ? 'dashed' : 'solid'} ${tok.borderHex}`,
                          transition: `background-color .55s cubic-bezier(.22,1,.36,1) ${(i % 7) * 26}ms, border-color .55s cubic-bezier(.22,1,.36,1) ${(i % 7) * 26}ms`,
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              <div style={{ marginTop: 18, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {(['family', 'insurance', 'paid'] as const).map((k) => (
                  <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 700, color: '#BFB4AA' }}>
                    <span style={{ width: 12, height: 12, borderRadius: 3, background: SLOT_COLORS[k].bgHex, border: `2px solid ${SLOT_COLORS[k].borderHex}` }} />
                    {SLOT_COLORS[k].label}
                  </span>
                ))}
              </div>

              {/* 共有リンク（ステージ2でのみ存在する） */}
              {stage === 2 && (
                <div
                  style={{
                    marginTop: 16, display: 'flex', alignItems: 'center', gap: 11,
                    padding: '13px 15px', borderRadius: 12,
                    border: `2px solid ${PRIMARY}`, background: '#241C18',
                    opacity: sent ? 1 : 0.55,
                    transform: sent ? 'none' : 'translateY(6px)',
                    transition: 'opacity .5s ease, transform .5s cubic-bezier(.22,1,.36,1)',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ED6A2C" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                    <path d="M10 14l4-4" /><path d="M13.5 6.5l1.5-1.5a3.5 3.5 0 0 1 5 5l-1.5 1.5" /><path d="M10.5 17.5L9 19a3.5 3.5 0 0 1-5-5l1.5-1.5" />
                  </svg>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#F6F0EA' }}>keashiru.jp/p/8f2a</span>
                  <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#ED6A2C' }}>
                    {sent ? '開かれました' : '送信中'}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ED6A2C" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
                      <path d="M5 12h13M13 6l6 6-6 6" />
                    </svg>
                  </span>
                </div>
              )}
            </div>

            {/* ---------- 中央：コネクタ（ステージ2のみ） ---------- */}
            <div aria-hidden="true" style={{ position: 'relative', height: 40, display: 'flex', alignItems: 'center', opacity: stage === 2 ? 1 : 0, transition: 'opacity .5s ease' }}>
              {stage === 2 && (
                <>
                  <span style={{ flex: 1, borderTop: '2px dashed #ED6A2C' }} />
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ED6A2C" strokeWidth="3" strokeLinecap="round" style={{ marginLeft: -2 }}>
                    <path d="M8 5l7 7-7 7" />
                  </svg>
                  <span
                    style={{
                      position: 'absolute', left: 0, top: '50%', marginTop: -5,
                      width: 10, height: 10, borderRadius: 999, background: '#ED6A2C',
                      boxShadow: '0 0 12px 4px rgba(237,106,44,0.45)',
                      opacity: sent ? 0 : 1,
                      animation: reduced ? undefined : 'zap 0.95s linear infinite',
                      transition: 'opacity .45s ease',
                    }}
                  />
                </>
              )}
            </div>

            {/* ---------- 右：ステージ別 ---------- */}
            <div style={{ position: 'relative', minHeight: 320 }}>
              {/* ===== ステージ0：上から順にタイプされて埋まる ===== */}
              <div
                style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14,
                  opacity: stage === 0 ? 1 : 0, transform: stage === 0 ? 'none' : 'translateY(10px)',
                  transition: 'opacity .5s ease, transform .5s cubic-bezier(.22,1,.36,1)',
                  pointerEvents: stage === 0 ? 'auto' : 'none',
                }}
              >
                {QDATA.map((r, i) => {
                  const startT = Q_STARTS[i];
                  const typed = Math.max(0, Math.min(r.v.length, Math.floor((tick - startT) / TPC)));
                  const typing = stage === 0 && tick >= startT && typed < r.v.length;
                  const done = typed >= r.v.length;
                  return (
                    <div
                      key={r.k}
                      style={{
                        border: `2px solid ${typing ? PRIMARY : '#4A3E37'}`,
                        borderRadius: 12,
                        padding: '14px 18px',
                        background: '#2D231E',
                        opacity: tick >= startT ? 1 : 0.35,
                        transition: 'border-color .4s ease, opacity .4s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: '#A79A90' }}>{r.k}</span>
                        <span
                          aria-hidden="true"
                          style={{
                            width: 20, height: 20, borderRadius: 999, background: PRIMARY,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            opacity: done ? 1 : 0,
                            transform: done ? 'scale(1)' : 'scale(0.6)',
                            transition: 'opacity .35s ease, transform .35s cubic-bezier(.22,1,.36,1)',
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round">
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      </div>
                      <div style={{ marginTop: 6, height: 28, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <span style={{ fontSize: 20, fontWeight: 700, color: '#F6F0EA' }}>{r.v.slice(0, typed)}</span>
                        {/* 入力中の行だけキャレットを出す */}
                        <span
                          aria-hidden="true"
                          style={{
                            width: typing ? 2 : 0, height: 21, background: PRIMARY,
                            animation: reduced || !typing ? undefined : 'caretBlink 0.9s step-end infinite',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ===== ステージ1：安い順に採用 ===== */}
              <div
                style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14,
                  opacity: stage === 1 ? 1 : 0, transform: stage === 1 ? 'none' : 'translateY(10px)',
                  transition: 'opacity .5s ease, transform .5s cubic-bezier(.22,1,.36,1)',
                  pointerEvents: stage === 1 ? 'auto' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: '#A79A90' }}>1回あたりの安い順に採用</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#D98A55', fontVariantNumeric: 'tabular-nums' }}>
                    採用 {adopted} / {LADDER.length}
                  </span>
                </div>
                {LADDER.map((l, i) => {
                  const on = i < adopted;
                  return (
                    <div key={l.name} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <span style={{ width: 66, textAlign: 'right', fontSize: 14, fontWeight: 700, color: on ? '#F6F0EA' : '#8A7F76', fontVariantNumeric: 'tabular-nums', transition: 'color .4s ease' }}>
                        {l.price}
                      </span>
                      <span style={{ flex: 1, position: 'relative', height: 38, borderRadius: 10, background: '#2D231E', overflow: 'hidden' }}>
                        <span
                          style={{
                            position: 'absolute', inset: 0, borderRadius: 10, background: PRIMARY,
                            width: on ? `${l.w}%` : '0%',
                            transition: 'width .7s cubic-bezier(.22,1,.36,1)',
                          }}
                        />
                        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14, fontWeight: 700, color: '#F6F0EA', whiteSpace: 'nowrap' }}>
                          {l.name}
                        </span>
                      </span>
                      <span
                        aria-hidden="true"
                        style={{
                          width: 22, height: 22, borderRadius: 999, background: PRIMARY,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          opacity: on ? 1 : 0, transform: on ? 'scale(1)' : 'scale(0.6)',
                          transition: 'opacity .35s ease, transform .35s cubic-bezier(.22,1,.36,1)',
                        }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round">
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* ===== ステージ2：ケアマネジャーの画面 ===== */}
              <div
                style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center',
                  opacity: stage === 2 ? 1 : 0, transform: stage === 2 ? 'none' : 'translateY(10px)',
                  transition: 'opacity .5s ease, transform .5s cubic-bezier(.22,1,.36,1)',
                  pointerEvents: stage === 2 ? 'auto' : 'none',
                }}
              >
                <div style={{ border: `2px solid ${PRIMARY}`, borderRadius: 16, background: '#2D231E', padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span aria-hidden="true" style={{ width: 44, height: 44, borderRadius: 999, background: '#3A2E27', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#BFB4AA" strokeWidth="2" strokeLinecap="round">
                        <path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" />
                        <path d="M12 12.4a3.4 3.4 0 1 1 0-6.8 3.4 3.4 0 0 1 0 6.8z" />
                      </svg>
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 19, fontWeight: 700, color: '#F6F0EA' }}>ケアマネジャーの画面</div>
                      <div style={{ marginTop: 4, fontSize: 13, color: '#BFB4AA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        ご家族と同じ表を、そのまま見ています
                      </div>
                    </div>
                    <span
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 7, flexShrink: 0,
                        padding: '9px 16px', borderRadius: 999, background: PRIMARY,
                        fontSize: 13, fontWeight: 700, color: '#fff',
                        opacity: sent ? 1 : 0, transform: sent ? 'none' : 'translateY(-4px)',
                        transition: 'opacity .45s ease, transform .45s cubic-bezier(.22,1,.36,1)',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                      共有されました
                    </span>
                  </div>

                  {/* ミニ週表 */}
                  <div style={{ marginTop: 16, border: '2px solid #4A3E37', borderRadius: 12, padding: 10 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', gap: 4 }}>
                      {FLOWPLAN.map((k, i) => {
                        const tok = SLOT_COLORS[k];
                        return (
                          <div
                            key={i}
                            style={{
                              height: 13, borderRadius: 4,
                              background: tok.bgHex,
                              border: `1.5px ${k === 'none' ? 'dashed' : 'solid'} ${tok.borderHex}`,
                            }}
                          />
                        );
                      })}
                    </div>
                    <p style={{ marginTop: 12, fontSize: 12, color: '#A79A90' }}>家族が担う枠には、印がついたまま届きます</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: '#A79A90' }}>
            {stage === 0 && 'いまは、ほとんどの枠を家族が担っています'}
            {stage === 1 && '採用したぶんだけ、左の表の枠が色づきます'}
            {stage === 2 && '印のついた枠が、そのまま議題になります'}
          </p>
        </div>
      </section>

      {/* ============ フッターCTA ============ */}
      <section style={{ textAlign: 'center', padding: '104px 32px 120px' }}>
        <h2 className="font-display" style={{ fontSize: 'clamp(24px,3vw,34px)', fontWeight: 900, letterSpacing: '-0.03em' }}>
          1分で、はじめられます
        </h2>
        <button
          type="button"
          onClick={onStart}
          className="press"
          style={{
            marginTop: 32, height: 64, padding: '0 38px', borderRadius: 999,
            background: PRIMARY, color: '#fff', fontWeight: 700, fontSize: 18,
            border: `2px solid ${INK}`, boxShadow: `0 4px 0 ${INK}`,
          }}
        >
          3つの質問に答える
        </button>
        <p style={{ marginTop: 20, fontSize: 14, color: '#6E625B' }}>無料・登録不要</p>
      </section>
    </div>
  );
};
