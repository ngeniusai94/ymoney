import { useEffect, useRef, type ReactNode } from 'react'
import { useSettingsAccountDelete } from './useSettingsAccountDelete'

/** native dialog가 배경 클릭/키보드 포커스를 제한하고 닫을 때 시작 버튼으로 돌아갑니다. */
export function SettingsAccountDelete({ disabled }: { disabled: boolean }) {
  const dialog_ref = useRef<HTMLDialogElement>(null)
  const deletion = useSettingsAccountDelete()
  const resume_opened = useRef(false)
  useEffect(() => {
    if (!deletion.resume_ready || resume_opened.current) return
    resume_opened.current = true
    deletion.reset()
    dialog_ref.current?.showModal()
  }, [deletion])
  let content: ReactNode
  let message: ReactNode = null
  if (deletion.message) message = <p className="profile-delete-message" role="alert">{deletion.message}</p>
  if (deletion.stage === 'password') {
    content = <form onSubmit={(event) => { event.preventDefault(); void deletion.submit() }}>
      <h2 id="account-delete-title">계정 삭제 전 본인 확인</h2>
      <p>아이디 계정의 비밀번호를 입력해주세요.</p>
      <label htmlFor="delete-password">비밀번호</label>
      <input id="delete-password" type="password" autoComplete="current-password" autoFocus required
        value={deletion.password} disabled={deletion.is_busy} onChange={(event) => deletion.set_password(event.target.value)} />
      {message}
      <div className="profile-delete-actions"><button type="button" disabled={deletion.is_busy} onClick={() => dialog_ref.current?.close()}>취소</button>
        <button type="submit" disabled={deletion.is_busy}>본인 확인</button></div>
    </form>
  } else if (deletion.stage === 'kakao') {
    content = <form onSubmit={(event) => { event.preventDefault(); void deletion.submit() }}>
      <h2 id="account-delete-title">계정 삭제 전 본인 확인</h2>
      <p>현재 가입된 카카오 계정으로 다시 로그인해주세요. 본인 확인만으로 계정이 삭제되지는 않습니다.</p>
      {message}
      <button className="profile-delete-close" type="button" aria-label="계정 삭제 취소" disabled={deletion.is_busy}
        onClick={() => dialog_ref.current?.close()}>×</button>
      <div className="profile-delete-actions">
        <button className="profile-kakao-withdraw" type="submit" aria-label="가계부 탈퇴하기: 카카오로 본인 확인" disabled={deletion.is_busy}>가계부 탈퇴하기</button></div>
    </form>
  } else if (deletion.stage === 'confirmation') {
    let social_notice: ReactNode = null
    if (deletion.is_kakao) social_notice = <p>카카오 연결도 해제합니다. 연결 해제 후 서비스 삭제가 실패하면 재시도할 수 있습니다.</p>
    content = <form onSubmit={(event) => { event.preventDefault(); void deletion.submit() }}>
      <div className="profile-delete-warning" aria-hidden="true">⚠</div>
      <h2 id="account-delete-title">계정을 삭제할까요?</h2>
      <p>삭제한 계정과 개인 가계부는 복구할 수 없습니다.</p>
      {social_notice}
      <ul><li>개인 가계부와 모든 하위 데이터 영구 삭제</li><li>모든 공유 그룹에서 나가기</li><li>마지막 멤버인 그룹과 데이터 영구 삭제</li><li>다른 멤버가 남은 그룹의 지출은 유지</li></ul>
      <label htmlFor="delete-confirmation">확인을 위해 ‘삭제’를 입력해주세요.</label>
      <input id="delete-confirmation" value={deletion.confirmation} autoComplete="off" placeholder="삭제" required
        disabled={deletion.is_busy} onChange={(event) => deletion.set_confirmation(event.target.value)} />
      {message}
      <div className="profile-delete-actions"><button type="button" disabled={deletion.is_busy} onClick={() => dialog_ref.current?.close()}>취소</button>
        <button className="profile-delete-danger" type="submit" disabled={deletion.is_busy || deletion.confirmation !== '삭제'}>계정 삭제</button></div>
    </form>
  } else {
    content = <><h2 id="account-delete-title">계정이 삭제되었습니다.</h2>{message}<button type="button" disabled={deletion.is_busy} onClick={() => void deletion.finish()}>로그아웃 후 돌아가기</button></>
  }
  return <>
    <button type="button" className="profile-delete-button" disabled={disabled} onClick={() => { deletion.reset(); dialog_ref.current?.showModal() }}>계정 삭제</button>
    <dialog className="profile-delete-dialog" ref={dialog_ref} aria-labelledby="account-delete-title"
      onCancel={(event) => { if (deletion.is_busy || deletion.stage === 'complete') event.preventDefault() }} onClose={deletion.close}>
      {content}
    </dialog>
  </>
}
