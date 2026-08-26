/**
 * けあしる カラー＆ステータス定義
 * 
 * 4つのスロット状態（family / insurance / paid / none）に対応する
 * 仕様書準拠のカラーコード、背景色、テキスト色、ラベルを管理します。
 */

import { ServiceScheme, SlotState } from '@/types';

export interface SlotColorConfig {
  state: SlotState;
  label: string;
  shortLabel: string;
  bgHex: string;
  textHex: string;
  borderHex: string;
  badgeClass: string;
  cardClass: string;
  filterIdleClass: string;
  filterSelectedClass: string;
  description: string;
}

export const SLOT_COLORS: Record<SlotState, SlotColorConfig> = {
  family: {
    state: 'family',
    label: '家族が担っている',
    shortLabel: '家族',
    bgHex: '#FFF0E7',
    textHex: '#7C2D12',
    borderHex: '#C2410C',
    badgeClass: 'bg-[#FFF0E7] text-[#7C2D12] border-[#C2410C]',
    cardClass: 'bg-[#FFF0E7] text-[#7C2D12] border-[#C2410C] hover:bg-[#FDE3D1]',
    filterIdleClass: 'border-[#C2410C] bg-[#FFF0E7] text-[#7C2D12] hover:bg-[#FDE3D1]',
    filterSelectedClass: 'border-[#2D231E] bg-[#C2410C] text-white shadow-[0_3px_0_#2D231E]',
    description: '家族が自力で抱えている時間（見えない介護負担）',
  },
  insurance: {
    state: 'insurance',
    label: '介護保険給付・総合事業',
    shortLabel: '保険内',
    bgHex: '#EAF2FF',
    textHex: '#173B70',
    borderHex: '#2563EB',
    badgeClass: 'bg-[#EAF2FF] text-[#173B70] border-[#2563EB]',
    cardClass: 'bg-[#EAF2FF] text-[#173B70] border-[#2563EB] hover:bg-[#DCE9FF]',
    filterIdleClass: 'border-[#2563EB] bg-[#EAF2FF] text-[#173B70] hover:bg-[#DCE9FF]',
    filterSelectedClass: 'border-[#2D231E] bg-[#2563EB] text-white shadow-[0_3px_0_#2D231E]',
    description: '1〜3割負担で利用できる公的給付・総合事業サービス',
  },
  paid: {
    state: 'paid',
    label: '保険外（自治体・民間・互助）',
    shortLabel: '保険外',
    bgHex: '#F4EAFE',
    textHex: '#5B247A',
    borderHex: '#7E22CE',
    badgeClass: 'bg-[#F4EAFE] text-[#5B247A] border-[#7E22CE]',
    cardClass: 'bg-[#F4EAFE] text-[#5B247A] border-[#7E22CE] hover:bg-[#EBD9FB]',
    filterIdleClass: 'border-[#7E22CE] bg-[#F4EAFE] text-[#5B247A] hover:bg-[#EBD9FB]',
    filterSelectedClass: 'border-[#2D231E] bg-[#7E22CE] text-white shadow-[0_3px_0_#2D231E]',
    description: '自治体上乗せ施策・シルバー人材・民間自費・地域互助サービス',
  },
  none: {
    state: 'none',
    label: '予定なし / リスク枠',
    shortLabel: 'なし',
    bgHex: '#F1F3F5',
    textHex: '#374151',
    borderHex: '#6B7280',
    badgeClass: 'bg-[#F1F3F5] text-[#374151] border-dashed border-[#6B7280]',
    cardClass: 'bg-[#F1F3F5] text-[#374151] border-dashed border-[#6B7280] hover:bg-[#E7EAED]',
    filterIdleClass: 'border-dashed border-[#6B7280] bg-[#F1F3F5] text-[#374151] hover:bg-[#E7EAED]',
    filterSelectedClass: 'border-[#2D231E] bg-[#59616D] text-white shadow-[0_3px_0_#2D231E]',
    description: '困りごとが登録されていない、または対応者不在の枠',
  },
};

/**
 * サービススキーム別のバッジ表示設定
 */
export const SCHEME_LABELS: Record<ServiceScheme, { label: string; badgeColor: string }> = {
  insurance: {
    label: '介護保険給付',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  sogo_jigyo: {
    label: '総合事業',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  municipal_extra: {
    label: '自治体上乗せ施策',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  private_paid: {
    label: '民間自費サービス',
    badgeColor: 'bg-orange-100 text-orange-800 border-orange-300',
  },
  mutual_aid: {
    label: '地域互助・NPO',
    badgeColor: 'bg-sky-100 text-sky-800 border-sky-300',
  },
};
