export function notify(message, type = 'info') {
  window.dispatchEvent(new CustomEvent('apteka:toast', {
    detail: { message, type }
  }));
}
