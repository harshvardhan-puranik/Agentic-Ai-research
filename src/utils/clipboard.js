/**
 * Robust clipboard copy helper with legacy fallback for iframes and headless environments
 */
export async function copyTextToClipboard(text) {
  if (!text) return false;

  // Modern Async Clipboard API
  if (navigator && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // Ignore and proceed to fallback
    }
  }

  // Fallback using textarea execCommand
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  } catch (err) {
    console.warn('Fallback copy error:', err);
    return false;
  }
}

export const copyToClipboard = copyTextToClipboard;
