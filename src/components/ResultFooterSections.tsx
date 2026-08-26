/**
 * 結果画面の下部
 *
 * ・わからないことを聞く（相談への入り口）
 * ・この内容をケアマネジャーに送る（共有と印刷）
 */

'use client';

import React from 'react';

const INK = '#2D231E';
const PRIMARY = '#C4511A';
const SUB = '#6E625B';

/** その場で押せる、よくある質問 */
const SUGGESTIONS = [
  '費用はどのくらいになる？',
  'このサービスを減らせる？',
  'なぜこの組み合わせなの？',
  '空いている枠はある？',
];

interface ResultFooterSectionsProps {
  onAsk: (question: string) => void;
  onShare: () => void;
  onPrint: () => void;
}

/** わからないことを聞く（頼むサービスの手前に置く） */
export const AskSection: React.FC<{ onAsk: (q: string) => void }> = ({ onAsk }) => (
  <>
    {/* わからないことを聞く */}
    <section style={{ border: `2px solid ${INK}`, borderRadius: 16, background: '#FFF3EA', padding: '28px 30px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
        <div>
          <h2 className="font-display" style={{ fontSize: 22, fontWeight: 700, color: INK }}>
            わからないことを聞く
          </h2>
          <p style={{ marginTop: 6, fontSize: 14, lineHeight: 1.85, color: SUB, maxWidth: '54ch' }}>
            入力いただいた条件とこの結果をふまえて答えます。判断が必要なことは、ケアマネジャーへの相談事項として整理します。
          </p>
        </div>
        <button
          type="button"
          onClick={() => onAsk('')}
          className="press"
          style={{
            flexShrink: 0, minHeight: 52, padding: '0 26px', borderRadius: 999,
            border: `2px solid ${INK}`, background: '#fff', fontSize: 16, fontWeight: 700,
            color: INK, boxShadow: `0 3px 0 ${INK}`,
          }}
        >
          自由に書いて聞く
        </button>
      </div>
      <div style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onAsk(s)}
            className="press-sm"
            style={{
              minHeight: 44, padding: '0 18px', borderRadius: 999,
              border: '2px solid #DCCFC4', background: '#fff',
              fontSize: 14, fontWeight: 700, color: '#4A413A',
            }}
          >
            {s}
          </button>
        ))}
      </div>
    </section>
  </>
);

/** この内容をケアマネジャーに送る（ページ末尾） */
export const HandoffSection: React.FC<{ onShare: () => void; onPrint: () => void }> = ({ onShare, onPrint }) => (
  <>
    {/* ケアマネジャーに送る */}
    <section style={{ border: `2px solid ${INK}`, borderRadius: 16, background: INK, color: '#F6F0EA', padding: '36px 40px' }}>
      <h2 className="font-display" style={{ fontSize: 26, fontWeight: 700 }}>
        この内容をケアマネジャーに送る
      </h2>
      <p style={{ marginTop: 12, fontSize: 16, lineHeight: 1.95, color: '#BFB4AA', maxWidth: '52ch' }}>
        リンクを送ると、相手の画面には1週間の表・費用の一覧・伝えたいこと・面談で聞きたいことが並びます。紙で渡す場合はA4 1枚に収まります。
      </p>
      <div style={{ marginTop: 26, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={onShare}
          className="press"
          style={{
            minHeight: 56, padding: '0 28px', borderRadius: 999,
            background: PRIMARY, color: '#fff', fontSize: 16, fontWeight: 700,
            border: '2px solid #F6F0EA',
          }}
        >
          送る画面を確認する
        </button>
        <button
          type="button"
          onClick={onPrint}
          className="press"
          style={{
            minHeight: 56, padding: '0 28px', borderRadius: 999,
            border: '2px solid #6E625B', color: '#F6F0EA', fontSize: 16, fontWeight: 700,
            background: 'transparent',
          }}
        >
          A4 1枚に印刷する
        </button>
      </div>
    </section>
  </>
);

/** 互換用：2つを続けて出す */
export const ResultFooterSections: React.FC<ResultFooterSectionsProps> = ({ onAsk, onShare, onPrint }) => (
  <>
    <AskSection onAsk={onAsk} />
    <HandoffSection onShare={onShare} onPrint={onPrint} />
  </>
);
