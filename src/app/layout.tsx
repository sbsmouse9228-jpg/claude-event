import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'MOA — 모임 이벤트 관리',
  description: '공지·출석·카풀·정산을 하나의 초대 링크로 처리하는 모임 관리 플랫폼',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className={`${geistSans.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900 antialiased">
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  )
}
