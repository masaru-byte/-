/**
 * ヘッダーナビゲーション コンポーネント
 *
 * アプリのロゴと、各画面（タイムライン／自治体ダッシュボード／収集・承認管理）の切り替えを提供します。
 */

'use client';

import React from 'react';
import { Clock, BarChart3, Database } from 'lucide-react';

export type ActiveTab = 'timeline' | 'gov' | 'admin';

interface HeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onReset: () => void;
}

const TABS: { key: ActiveTab; label: string; icon: React.ElementType }[] = [
  { key: 'timeline', label: 'ケアタイムライン', icon: Clock },
  { key: 'gov', label: '自治体ダッシュボード', icon: BarChart3 },
  { key: 'admin', label: 'サービス管理', icon: Database },
];

export const Header: React.FC<HeaderProps> = ({ activeTab, onSelectTab, onReset }) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-stone-200 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* ロゴ */}
          <button
            type="button"
            onClick={onReset}
            className="flex items-center space-x-2.5 text-left rounded-lg focus-visible:outline-2 focus-visible:outline-orange-600 focus-visible:outline-offset-2"
          >
            <span className="w-9 h-9 rounded-lg bg-orange-600 flex items-center justify-center text-white shrink-0">
              <Clock className="w-5 h-5" />
            </span>
            <span className="min-w-0">
              <span className="block font-bold text-lg tracking-tight text-stone-900 leading-tight">
                けあしる
              </span>
              <span className="block text-xs text-stone-500 hidden sm:block leading-tight">
                介護の「見えない時間」を可視化し、保険外サービスを探す
              </span>
            </span>
          </button>

          {/* ナビゲーション */}
          <nav className="flex items-center gap-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => onSelectTab(tab.key)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-orange-50 text-orange-800 font-bold'
                      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 font-medium'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-orange-600' : 'text-stone-400'}`} />
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
