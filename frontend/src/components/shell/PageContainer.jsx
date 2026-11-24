import React from 'react';

export default function PageContainer({ children, className = '' }) {
  return (
    <main className={`min-h-screen pt-20 pb-16 px-4 sm:px-6 md:px-8 max-w-5xl mx-auto font-sans overflow-x-hidden ${className}`}>
      {children}
    </main>
  );
}
