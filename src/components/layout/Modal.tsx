import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { useI18n } from '../../useI18n'
export default function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  const { tr } = useI18n()
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close() }, [])
  return <dialog ref={ref} className="calm-modal" aria-label={title} onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if(event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose() } }}><header><h2>{title}</h2><button onClick={onClose} aria-label={tr('Close','داخستن')}><X size={20}/></button></header>{children}</dialog>
}
