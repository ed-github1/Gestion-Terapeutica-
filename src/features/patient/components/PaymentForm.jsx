/**
 * PaymentForm.jsx
 * Reusable card-payment form used by:
 *   - AppointmentRequest (step 2 — patient self-books)
 *   - AppointmentPaymentModal (patient pays for a professional-booked appointment)
 *
 * Props:
 *   amount       {number}   — charge amount to display
 *   loading      {boolean}  — disables the submit button and shows a spinner
 *   onSubmit     {fn}       — called with { cardNumber, cardName, expiryDate, cvv }
 *   onCancel     {fn}       — called when the cancel/back button is clicked
 *   cancelLabel  {string}   — label for the cancel button (default: 'Cancelar')
 *   currency     {string}   — currency symbol (default: '€')
 */
import { useState } from 'react'
import { motion } from 'motion/react'
import { Lock } from 'lucide-react'

const inputCls =
  'w-full px-3 py-2.5 text-[13px] border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition bg-white placeholder:text-gray-300'
const labelCls =
  'block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5'

const formatCardNumber = (value) =>
  value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim().slice(0, 19)

const formatExpiryDate = (value) => {
  const digits = value.replace(/\D/g, '')
  return digits.length >= 2 ? `${digits.slice(0, 2)}/${digits.slice(2, 4)}` : digits
}

const PaymentForm = ({
  amount,
  loading = false,
  onSubmit,
  onCancel,
  cancelLabel = 'Cancelar',
  currency = '€',
}) => {
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  })

  const set = (field, value) => setFormData(prev => ({ ...prev, [field]: value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit?.(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Card name */}
      <div>
        <label className={labelCls}>Nombre en la tarjeta</label>
        <input
          type="text"
          required
          value={formData.cardName}
          onChange={e => set('cardName', e.target.value)}
          className={inputCls}
          placeholder="María González"
        />
      </div>

      {/* Card number */}
      <div>
        <label className={labelCls}>Número de tarjeta</label>
        <input
          type="text"
          required
          value={formData.cardNumber}
          onChange={e => set('cardNumber', formatCardNumber(e.target.value))}
          maxLength={19}
          className={`${inputCls} font-mono`}
          placeholder="1234 5678 9012 3456"
        />
      </div>

      {/* Expiry + CVV */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Vencimiento</label>
          <input
            type="text"
            required
            value={formData.expiryDate}
            onChange={e => set('expiryDate', formatExpiryDate(e.target.value))}
            maxLength={5}
            className={`${inputCls} font-mono`}
            placeholder="MM/YY"
          />
        </div>
        <div>
          <label className={labelCls}>CVV</label>
          <input
            type="password"
            required
            value={formData.cvv}
            onChange={e => set('cvv', e.target.value.replace(/\D/g, '').slice(0, 4))}
            maxLength={4}
            className={`${inputCls} font-mono`}
            placeholder="•••"
          />
        </div>
      </div>

      {/* Security note */}
      <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
        <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        <p className="text-[11px] text-gray-400 leading-snug">
          Pago seguro con cifrado SSL 256 bits. Tu información está protegida.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2.5 pt-1">
        <motion.button
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 text-[13px] font-semibold text-gray-600 bg-white hover:bg-gray-50 rounded-xl transition border border-gray-200"
        >
          {cancelLabel}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          type="submit"
          disabled={loading}
          className="flex-2 px-4 py-2.5 text-[13px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Procesando...
            </>
          ) : (
            `Pagar ${currency}${amount}`
          )}
        </motion.button>
      </div>
    </form>
  )
}

export default PaymentForm
