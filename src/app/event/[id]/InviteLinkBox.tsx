'use client'

import { useState } from 'react'

export default function InviteLinkBox({ inviteUrl }: { inviteUrl: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
      <p className="text-xs font-semibold text-indigo-600 mb-2 uppercase tracking-wider">
        초대 링크
      </p>
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={inviteUrl}
          className="flex-1 text-xs text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-2 truncate focus:outline-none"
        />
        <button
          onClick={handleCopy}
          className="shrink-0 px-3 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap"
        >
          {copied ? '복사됨!' : '복사'}
        </button>
      </div>
      <p className="text-xs text-indigo-500 mt-2">
        이 링크를 카카오톡으로 공유하세요
      </p>
    </div>
  )
}
