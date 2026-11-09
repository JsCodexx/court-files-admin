type Tone = 'neutral' | 'success' | 'warn' | 'danger' | 'info';

const toneMap: Record<string, Tone> = {
  paid: 'success',
  active: 'success',
  free: 'info',
  grace: 'warn',
  lapsed: 'danger',
  none: 'neutral',
  pending: 'warn',
  approved: 'success',
  rejected: 'danger',
  failed: 'danger',
};

type Props = {
  status: string;
};

export function StatusBadge({ status }: Props) {
  const key = status.toLowerCase();
  const tone = toneMap[key] ?? 'neutral';
  return (
    <span className={`status-badge status-badge--${tone}`}>
      {status}
    </span>
  );
}
