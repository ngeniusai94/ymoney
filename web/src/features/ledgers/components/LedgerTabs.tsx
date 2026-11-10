import './LedgerTabs.css'

/** 한 번에 한 가계부 또는 조회 범위를 고르는 공통 버튼 목록입니다. */
export default function LedgerTabs({ label, options, selected_id, on_select }: {
  label: string
  options: ReadonlyArray<{ id: string; name: string }>
  selected_id: string | null
  on_select: (id: string) => void
}) {
  if (options.length === 0) return null

  return (
    <div className="ledger-tabs" data-columns={Math.min(options.length, 3)} role="group" aria-label={label}>
      {options.map(option => (
        <button type="button" key={option.id} aria-pressed={selected_id === option.id} onClick={() => on_select(option.id)}>
          {option.name}
        </button>
      ))}
    </div>
  )
}
