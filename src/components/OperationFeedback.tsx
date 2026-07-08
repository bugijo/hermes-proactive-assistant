export function OperationFeedback({ busy, error }: { busy?: boolean; error?: string }) {
  if (error)
    return (
      <p
        role="alert"
        className="mb-3 rounded-xl bg-destructive/15 px-3 py-2 text-xs text-destructive"
      >
        {error}
      </p>
    );
  if (busy)
    return (
      <p role="status" className="mb-3 rounded-xl bg-primary/10 px-3 py-2 text-xs text-primary">
        Salvando na API local…
      </p>
    );
  return null;
}
