/**
 * Accessibility Utilities
 * Helper functions for accessibility features
 */

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(message, priority = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'alert');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Get skip link HTML
 */
export function SkipLink({ href, children }) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:right-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg"
    >
      {children}
    </a>
  );
}

/**
 * Ensure minimum touch target size
 */
export const MIN_TOUCH_TARGET = 44; // pixels

/**
 * Check if element meets touch target requirements
 */
export function meetsTouchTarget(element) {
  const rect = element.getBoundingClientRect();
  return rect.width >= MIN_TOUCH_TARGET && rect.height >= MIN_TOUCH_TARGET;
}

