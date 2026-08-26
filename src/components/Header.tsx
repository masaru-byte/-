/**
 * ヘッダー
 *
 * 主役は市民向け画面ただひとつ。行政・管理向けの画面は
 * 右上の控えめなリンクに格下げし、一般ユーザーを迷わせない。
 */

'use client';

import React from 'react';
import { Bird, Building2, Database } from 'lucide-react';

export type ActiveTab = 'timeline' | 'gov' | 'admin';

interface HeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onHome: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onSelectTab, onHome }) => {
  return (
    <header className="sticky top-0 z-40 bg-stone-50 border-b-2 border-stone-900 no-print">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* ブランド */}
          <button
            type="button"
            onClick={onHome}
            aria-label="けあしる ホームへ"
            className="press min-h-11 flex items-center gap-2.5 rounded-xl"
          >
            <span className="w-10 h-10 rounded-full bg-orange-600 border-2 border-stone-900 flex items-center justify-center text-white shrink-0 shadow-[0_2px_0_#251B17]">
              <Bird className="w-5 h-5" strokeWidth={2.5} />
            </span>
            <span>
              <span className="block font-extrabold text-xl tracking-tight text-stone-900 leading-none">
                けあしる
              </span>
              <span className="hidden sm:block mt-1 text-[13px] font-bold text-orange-700 leading-none">
                暮らしのケア時間を見える形に
              </span>
            </span>
          </button>

          {/* 関係者向けリンクと表示設定 */}
          <div className="flex items-center gap-1">
          <nav className="flex items-center gap-1 text-[13px]" aria-label="関係者向け">
            {activeTab !== 'timeline' && (
              <button
                type="button"
                onClick={() => onSelectTab('timeline')}
                aria-label="けあしるに戻る"
                className="h-11 px-2.5 sm:px-3 rounded-xl font-bold text-orange-800 hover:bg-orange-100 transition-colors"
              >
                <span className="sm:hidden" aria-hidden="true">←</span>
                <span className="hidden sm:inline">← けあしるに戻る</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onSelectTab('gov')}
              aria-label="自治体の方へ"
              aria-current={activeTab === 'gov' ? 'page' : undefined}
              className={`h-11 px-2.5 sm:px-3 rounded-xl font-semibold transition-colors inline-flex items-center gap-1.5 ${
                activeTab === 'gov'
                  ? 'text-orange-900 bg-orange-100'
                  : 'text-stone-400 hover:text-stone-700 hover:bg-stone-50'
              }`}
            >
              <Building2 className="w-4 h-4 sm:hidden" aria-hidden="true" />
              <span className="hidden sm:inline">自治体の方へ</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('admin')}
              aria-label="サービス管理"
              aria-current={activeTab === 'admin' ? 'page' : undefined}
              className={`h-11 px-2.5 sm:px-3 rounded-xl font-semibold transition-colors inline-flex items-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'text-orange-900 bg-orange-100'
                  : 'text-stone-400 hover:text-stone-700 hover:bg-stone-50'
              }`}
            >
              <Database className="w-4 h-4 sm:hidden" aria-hidden="true" />
              <span className="hidden sm:inline">サービス管理</span>
            </button>
          </nav>
          </div>
        </div>
      </div>
    </header>
  );
};
