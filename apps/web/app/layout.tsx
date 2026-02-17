import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Florida Journeyman Electrician Exam',
  description: 'Practice exam platform for Florida Journeyman Electrician certification',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
