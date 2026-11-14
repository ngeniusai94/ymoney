import hyundai_card from './assets/hyundai-card.svg'
import samsung_card from './assets/samsung-card.svg'
import shinhan_card from './assets/shinhan-card.svg'
import kb_card from './assets/kb-card.svg'
import woori_card from './assets/woori-card.svg'
import lotte_card from './assets/lotte-card.svg'
import hana_card from './assets/hana-card.svg'
import nh_card from './assets/nh-card.svg'
import kakao_card from './assets/kakao-card.svg'
import toss_card from './assets/toss-card.svg'
import bc_card from './assets/bc-card.svg'

/** 배열 순서가 기본 표시 순서입니다. 키워드는 결제수단 이름의 일부와 비교합니다. */
export const card_icons = [
  { key: 'hyundai', label: '현대카드', src: hyundai_card, keywords: ['현대', 'hyundae', '애플'] },
  { key: 'samsung', label: '삼성카드', src: samsung_card, keywords: ['삼성', 'samsung'] },
  { key: 'shinhan', label: '신한카드', src: shinhan_card, keywords: ['신한', 'shinhan'] },
  { key: 'kb', label: 'KB국민카드', src: kb_card, keywords: ['국민', 'kb', 'koomin'] },
  { key: 'woori', label: '우리카드', src: woori_card, keywords: ['우리', 'woori', '위비'] },
  { key: 'lotte', label: '롯데카드', src: lotte_card, keywords: ['롯데', 'lotte'] },
  { key: 'hana', label: '하나카드', src: hana_card, keywords: ['하나', 'hana'] },
  { key: 'nh', label: 'NH농협카드', src: nh_card, keywords: ['농협', 'nh'] },
  { key: 'kakao', label: '카카오뱅크카드', src: kakao_card, keywords: ['카카오', 'kakao'] },
  { key: 'toss', label: '토스뱅크', src: toss_card, keywords: ['토스', 'toss'] },
  { key: 'bc', label: 'BC카드', src: bc_card, keywords: ['비씨', 'BC'] },
]

export function get_ordered_card_icons(method_name: string): typeof card_icons {
  const name = method_name.toLowerCase()
  const matching: typeof card_icons = []
  const other: typeof card_icons = []

  // 일치 여부로만 나누고 각 목록 안에서는 배열에 적힌 순서를 따릅니다.
  for (const icon of card_icons) {
    const matches = icon.keywords.some((keyword) => name.includes(keyword.toLowerCase()))
    if (matches) matching.push(icon)
    else other.push(icon)
  }

  return [...matching, ...other]
}
