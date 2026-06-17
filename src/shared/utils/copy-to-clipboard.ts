/**
 * Copia texto al portapapeles con Clipboard API en contexto seguro
 * o fallback síncrono (execCommand) en HTTP dev (*.app.local).
 */
function copyWithExecCommand(text: string): void {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '0';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, text.length);

  try {
    const ok = document.execCommand('copy');
    if (!ok) {
      throw new Error('document.execCommand("copy") returned false');
    }
  } finally {
    document.body.removeChild(textarea);
  }
}

export async function copyTextToClipboard(text: string): Promise<void> {
  const value = typeof text === 'string' ? text : String(text ?? '');
  if (!value) {
    throw new Error('No hay texto para copiar');
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }

  copyWithExecCommand(value);
}
