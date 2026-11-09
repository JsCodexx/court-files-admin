type Props = {
  label?: string;
};

export function LoadingState({ label = 'Loading…' }: Props) {
  return (
    <div className="loading-state" role="status">
      <span className="loading-spinner" aria-hidden />
      <span>{label}</span>
    </div>
  );
}
