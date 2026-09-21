type SessionExpiredListener = () => void;

let listener: SessionExpiredListener | null = null;

export function onSessionExpired(callback: SessionExpiredListener): () => void {
  listener = callback;
  return () => {
    if (listener === callback) listener = null;
  };
}

export function emitSessionExpired(): void {
  listener?.();
}
