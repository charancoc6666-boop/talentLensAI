import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TalentLens AI - Evidence-Based HR Recruiter',
  description: 'AI-powered resume, portfolio, and project analysis for evidence-backed candidate screening.',
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
