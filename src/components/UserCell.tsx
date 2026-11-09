type Props = {
  name: string;
  email: string;
};

function initials(name: string, email: string): string {
  const fromName = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
  if (fromName) return fromName;
  return email.slice(0, 2).toUpperCase();
}

export function UserCell({ name, email }: Props) {
  return (
    <div className="user-cell">
      <span className="user-cell__avatar" aria-hidden>
        {initials(name, email)}
      </span>
      <span className="user-cell__text">
        <span className="user-cell__name">{name || '—'}</span>
        <span className="user-cell__email">{email}</span>
      </span>
    </div>
  );
}
