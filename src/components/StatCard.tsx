type Props = {
  label: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'accent' | 'success' | 'warn' | 'danger';
};

export function StatCard({ label, value, hint, tone = 'default' }: Props) {
  return (
    <article className={`stat-card stat-card--${tone}`}>
      <p className="stat-card__label">{label}</p>
      <p className="stat-card__value">{value}</p>
      {hint ? <p className="stat-card__hint">{hint}</p> : null}
    </article>
  );
}
