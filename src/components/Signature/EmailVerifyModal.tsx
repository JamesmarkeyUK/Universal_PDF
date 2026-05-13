import { useState } from 'react'
import { useSignatureStore } from '../../stores/signatureStore'

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export default function EmailVerifyModal() {
  const open = useSignatureStore((s) => s.emailVerifyOpen)
  const pendingId = useSignatureStore((s) => s.pendingVerifyId)
  const closeEmailVerify = useSignatureStore((s) => s.closeEmailVerify)
  const setVerifiedEmail = useSignatureStore((s) => s.setVerifiedEmail)

  const [step, setStep] = useState<'email' | 'code' | 'done'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [sentCode] = useState(() => generateCode())
  const [inputCode, setInputCode] = useState('')
  const [error, setError] = useState('')

  if (!open) return null

  function close() {
    setStep('email')
    setEmail('')
    setCode('')
    setInputCode('')
    setError('')
    closeEmailVerify()
  }

  function sendCode() {
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }
    setError('')
    setCode(sentCode)
    setStep('code')
  }

  function verifyCode() {
    if (inputCode.trim() !== sentCode) {
      setError('Incorrect code. Please try again.')
      return
    }
    if (pendingId) {
      setVerifiedEmail(pendingId, email.trim())
    }
    setStep('done')
  }

  function done() {
    close()
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) close() }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Verified Signature
          </h2>
          <button
            onClick={close}
            className="text-slate-400 hover:text-slate-700 text-2xl leading-none w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        {step === 'email' && (
          <>
            <p className="text-sm text-slate-500 mb-4">
              Verify your email address to add a "Verified as…" label to this signature when it is placed on a document.
            </p>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email address
            </label>
            <input
              type="email"
              autoFocus
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError('') }}
              placeholder="you@example.com"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              onKeyDown={(e) => { if (e.key === 'Enter') sendCode() }}
            />
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
            <button
              onClick={sendCode}
              className="mt-4 w-full py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-medium"
            >
              Send Verification Code
            </button>
          </>
        )}

        {step === 'code' && (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-blue-800">Verification email sent to:</p>
              <p className="text-sm text-blue-700 mt-0.5">{email}</p>
              <p className="text-xs text-blue-500 mt-3">
                (Demo mode — no actual email is sent. Your code is shown below.)
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-blue-600">Your code:</span>
                <span className="font-mono font-bold text-blue-900 text-sm tracking-widest bg-blue-100 px-2 py-0.5 rounded">
                  {code}
                </span>
              </div>
            </div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Enter 6-digit code
            </label>
            <input
              type="text"
              autoFocus
              value={inputCode}
              onChange={(e) => { setInputCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }}
              placeholder="000000"
              maxLength={6}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-orange-500"
              onKeyDown={(e) => { if (e.key === 'Enter') verifyCode() }}
            />
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => { setStep('email'); setInputCode(''); setError('') }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm"
              >
                Back
              </button>
              <button
                onClick={verifyCode}
                className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-medium"
              >
                Verify
              </button>
            </div>
          </>
        )}

        {step === 'done' && (
          <>
            <div className="flex flex-col items-center py-6">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-3xl mb-4">
                ✓
              </div>
              <p className="text-base font-semibold text-slate-900">Email Verified!</p>
              <p className="text-sm text-slate-500 mt-1 text-center">
                When this signature is placed on a document it will display:<br />
                <span className="font-medium text-slate-700">✓ Verified as: {email}</span>
              </p>
            </div>
            <button
              onClick={done}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium"
            >
              Done
            </button>
          </>
        )}
      </div>
    </div>
  )
}
