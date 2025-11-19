import React from 'react';

export function PageLayout({
  title,
  description,
  headerContent,
  children,
  className = ""
}) {
  const hasHeader = title || description || headerContent;

  return (
    <div className={`flex flex-col h-full bg-slate-50 ${className}`}>
      
      {/* 1. Fixed Header (Non-scrolling) */}
      {hasHeader && (
        <div className="flex-shrink-0 bg-white border-b border-slate-200 shadow-sm z-10">
          <div className="px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              
              {/* Title Section */}
              {(title || description) && (
                <div className="flex-1 min-w-0">
                  {title && (
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                      {title}
                    </h1>
                  )}
                  {description && (
                    <p className="mt-1 text-sm text-slate-500 truncate">
                      {description}
                    </p>
                  )}
                </div>
              )}

              {/* Action/Search Section - Now part of the solid header */}
              {headerContent && (
                <div className="flex-shrink-0 w-full md:w-auto">
                  {headerContent}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto min-h-0 scroll-smooth">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}