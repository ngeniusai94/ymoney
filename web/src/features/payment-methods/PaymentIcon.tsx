import default_card_icon from './assets/default-card.svg'
import { card_icons } from './payment-method-icons'
import type { PaymentMethodType } from './payment-methods.api'

/** 이름 옆에 표시하는 장식용 아이콘입니다. */
export default function PaymentIcon({ type, icon_key }: { type: PaymentMethodType | null; icon_key?: string | null }) {
  if (type === 'CASH') return <span aria-hidden="true">₩</span>
  if (type !== 'CARD') return null

  const icon = card_icons.find((option) => option.key === icon_key)
  return <img className="payments-card-icon" src={icon?.src ?? default_card_icon} width={24} height={15} alt="" />
}
