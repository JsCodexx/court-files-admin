import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError, fetchPayments, type AdminPayment } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { DataTable, formatDate, type Column } from '../../components/DataTable';
import { LoadingState } from '../../components/LoadingState';
import { PageHeader } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { UserCell } from '../../components/UserCell';

export function PaymentsTab() {
  const { token } = useAuth();
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetchPayments(token);
      setPayments(res.payments);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load payments.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const statuses = useMemo(() => {
    const set = new Set(payments.map((p) => p.status));
    return ['all', ...Array.from(set).sort()];
  }, [payments]);

  const filtered = useMemo(
    () =>
      statusFilter === 'all'
        ? payments
        : payments.filter((p) => p.status === statusFilter),
    [payments, statusFilter]
  );

  const paidSum = useMemo(
    () =>
      payments
        .filter((p) => p.status === 'paid')
        .reduce((s, p) => s + p.amountPkr, 0),
    [payments]
  );

  const columns: Column<AdminPayment>[] = [
    {
      key: 'user',
      header: 'Customer',
      render: (p) => (
        <UserCell name={p.userName || '—'} email={p.userEmail || p.userId} />
      ),
    },
    {
      key: 'plan',
      header: 'Plan',
      render: (p) => <StatusBadge status={p.planId} />,
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (p) => (
        <span className="amount-cell">{p.amountPkr.toLocaleString()} PKR</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => <StatusBadge status={p.status} />,
    },
    {
      key: 'order',
      header: 'Order',
      render: (p) => <code className="mono">{p.merchantOrderId}</code>,
    },
    { key: 'when', header: 'Date', render: (p) => formatDate(p.createdAt) },
  ];

  if (loading) return <LoadingState label="Loading payments…" />;

  return (
    <section className="page">
      <PageHeader
        title="Payments"
        subtitle="Gateway orders and settlement status."
        actions={
          <button type="button" className="btn btn--secondary" onClick={() => void load()}>
            Refresh
          </button>
        }
      />
      {error ? <p className="banner banner--error">{error}</p> : null}

      <div className="stat-grid stat-grid--compact">
        <StatCard label="Total records" value={payments.length.toLocaleString()} />
        <StatCard
          label="Paid volume"
          value={`${paidSum.toLocaleString()} PKR`}
          tone="success"
        />
        <StatCard
          label="Paid count"
          value={payments.filter((p) => p.status === 'paid').length.toLocaleString()}
          tone="accent"
        />
      </div>

      <div className="chip-group chip-group--wrap">
        {statuses.map((s) => (
          <button
            key={s}
            type="button"
            className={statusFilter === s ? 'chip chip--active' : 'chip'}
            onClick={() => setStatusFilter(s)}
          >
            {s === 'all' ? 'All statuses' : s}
          </button>
        ))}
      </div>

      <DataTable columns={columns} rows={filtered} rowKey={(p) => p.id} />
    </section>
  );
}
