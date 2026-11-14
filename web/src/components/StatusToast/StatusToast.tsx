import './StatusToast.css'

export default function StatusToast({ message }: { message: string }) {
  return <div className="status-toast" role="alert" aria-atomic="true">
    {message && <p>{message}</p>}
  </div>
}
