import type { Metadata } from 'next'
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
  title: 'Enterprise Portal | GlimmoraTeam',
  description: 'GlimmoraTeam enterprise project management portal',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // When fonts are ready, add className={`${millerDisplay.variable} ${avenirLTStd.variable}`} to html
  return (
    <html lang="en">
      <body className="font-body bg-bg-app text-text-body">{children}</body>
    </html>
  )
}
