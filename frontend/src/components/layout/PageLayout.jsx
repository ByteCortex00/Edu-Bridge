export function PageLayout({
  title,
  description,
  headerContent,
  children,
  className = ""
}) {
  const hasHeader = title || description || headerContent;

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Sticky Header Section */}
      {hasHeader && (
        <div className="sticky top-0 z-10 bg-gray-50 flex-shrink-0 space-y-6 pb-6 border-b border-gray-200">
          {(title || description) && (
            <div>
              {title && (
                <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
              )}
              {description && (
                <p className="text-gray-600 mt-1">{description}</p>
              )}
            </div>
          )}

          {headerContent && (
            <div>
              {headerContent}
            </div>
          )}
        </div>
      )}

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
}