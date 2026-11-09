import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ApiError,
  fetchSubscriptions,
  type AdminSubscription,
} from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { DataTable, formatShortDate, type Column } from '../../components/DataTable';
import { LoadingState } from '../../components/LoadingState';
import { PageHeader } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { UserCell } from '../../components/UserCell';

function daysUntil(iso: string): number | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / (86400000));
}

export function SubscriptionsTab() {
  const { token } = useAuth();
  const [rows, setRows] = useState<AdminSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetchSubscriptions(token);
      setRows(res.subscriptions);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Failed to load subscriptions.'
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const expiringSoon = useMemo(
    () =>
      rows.filter((r) => {
        const d = daysUntil(r.currentPeriodEnd);
        return d !== null && d >= 0 && d <= 14;
      }).length,
    [rows]
  );

  const columns: Column<AdminSubscription>[] = [
    {
      key: 'user',
      header: 'User',
      render: (s) => <UserCell name={s.userName} email={s.userEmail} />,
    },
    {
      key: 'plan',
      header: 'Plan',
      render: (s) => <StatusBadge status={s.planId} />,
    },
    {
      key: 'subStatus',
      header: 'Profile',
      render: (s) => <StatusBadge status={s.status} />,
    },
    {
      key: 'userStatus',
      header: 'Cached status',
      render: (s) => <StatusBadge status={s.userSubscriptionStatus} />,
    },
    {
      key: 'end',
      header: 'Period end',
      render: (s) => {
        const days = daysUntil(s.currentPeriodEnd);
        return (
          <span className="expiry-cell">
            {formatShortDate(s.currentPeriodEnd)}
            {days !== null && days < 0 ? (
              <span className="expiry-cell__tag expiry-cell__tag--past">Expired</span>
            ) : days !== null && days <= 14 ? (
              <span className="expiry-cell__tag expiry-cell__tag--soon">
                {days}d left
              </span>
            ) : null}
          </span>
        );
      },
    },
    {
      key: 'subscribed',
      header: 'Since',
      render: (s) => formatShortDate(s.subscribedAt),
    },
  ];

  if (loading) return <LoadingState label="Loading subscriptions…" />;

  return (
    <section className="page">
      <PageHeader
        title="Subscriptions"
        subtitle="Billing periods, cache fields, and upcoming expiries."
        actions={
          <button type="button" className="btn btn--secondary" onClick={() => void load()}>
            Refresh
          </button>
        }
      />
      {error ? <p className="banner banner--error">{error}</p> : null}

      <div className="stat-grid stat-grid--compact">
        <StatCard label="Active profiles" value={rows.length.toLocaleString()} tone="accent" />
        <StatCard
          label="Ending in 14 days"
          value={expiringSoon.toLocaleString()}
          tone="warn"
        />
      </div>

      <DataTable columns={columns} rows={rows} rowKey={(s) => s.userId} />
    </section>
  );
}
