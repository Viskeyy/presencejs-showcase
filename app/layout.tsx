import './globals.css'

export const metadata = {
  title: 'Presence Showcase',
  description: 'Generated by Presence',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
