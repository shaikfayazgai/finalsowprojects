import type { Metadata } from 'next'
import { getLocale, getMessages } from 'next-intl/server'
import { NextIntlClientProvider } from 'next-intl'
import { Providers } from '@/components/providers/Providers'
import './globals.css'

// Font loading -- uncomment when WOFF2 files are placed in packages/config/fonts/
// import localFont from 'next/font/local'
// const millerDisplay = localFont({
//   src: [
//     { path: '../../../../packages/config/fonts/MillerDisplay-Light.woff2', weight: '300' },
//     { path: '../../../../packages/config/fonts/MillerDisplay-Medium.woff2', weight: '500' },
//     { path: '../../../../packages/config/fonts/MillerDisplay-Black.woff2', weight: '900' },
//   ],
//   variable: '--font-miller-display',
// })
// const avenirLTStd = localFont({
//   src: [
//     { path: '../../../../packages/config/fonts/AvenirLTStd-Light.woff2', weight: '300' },
//     { path: '../../../../packages/config/fonts/AvenirLTStd-Roman.woff2', weight: '400' },
//     { path: '../../../../packages/config/fonts/AvenirLTStd-Medium.woff2', weight: '500' },
//     { path: '../../../../packages/config/fonts/AvenirLTStd-Heavy.woff2', weight: '800' },
//     { path: '../../../../packages/config/fonts/AvenirLTStd-Black.woff2', weight: '900' },
//   ],
//   variable: '--font-avenir',
// })

export const metadata: Metadata = {
  title: "Women's Portal | GlimmoraTeam",
  description: 'GlimmoraTeam contributor portal for women',
}

const RTL_LOCALES = ['ur', 'ar']

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages()
  const dir = RTL_LOCALES.includes(locale) ? 'rtl' : 'ltr'

  return (
    <html lang={locale} dir={dir}>
      <body className="font-body bg-bg-app text-text-body">
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
