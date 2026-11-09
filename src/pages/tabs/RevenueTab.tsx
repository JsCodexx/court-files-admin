import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ApiError, fetchRevenue, type RevenueMonth } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { LoadingState } from '../../components/LoadingState';
import { PageHeader } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';

export function RevenueTab() {
  const { token } = useAuth();
  const [revenue, setRevenue] = useState<RevenueMonth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetchRevenue(token, 12);
      setRevenue(res.revenue);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load revenue.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const total = useMemo(
    () => revenue.reduce((sum, r) => sum + r.totalPkr, 0),
    [revenue]
  );

  const paymentCount = useMemo(
    () => revenue.reduce((sum, r) => sum + r.paymentCount, 0),
    [revenue]
  );

  const bestMonth = useMemo(() => {
    if (revenue.length === 0) return null;
    return revenue.reduce((a, b) => (b.totalPkr > a.totalPkr ? b : a));
  }, [revenue]);

  const chartData = useMemo(
    () =>
      revenue.map((r) => ({
        label: r.month,
        month: r.month.slice(5),
        totalPkr: r.totalPkr,
        payments: r.paymentCount,
      })),
    [revenue]
  );

  if (loading) return <LoadingState label="Loading revenue…" />;

  return (
    <section className="page">
      <PageHeader
        title="Revenue"
        subtitle="Paid payments aggregated by calendar month."
        actions={
          <button type="button" className="btn btn--secondary" onClick={() => void load()}>
            Refresh
          </button>
        }
      />
      {error ? <p className="banner banner--error">{error}</p> : null}

      <div className="stat-grid">
        <StatCard
          label="12-month total"
          value={`${total.toLocaleString()} PKR`}
          tone="success"
        />
        <StatCard
          label="Paid transactions"
          value={paymentCount.toLocaleString()}
          tone="accent"
        />
        <StatCard
          label="Best month"
          value={
            bestMonth
              ? `${bestMonth.totalPkr.toLocaleString()} PKR`
              : '—'
          }
          hint={bestMonth?.month}
        />
      </div>

      <div className="panel card chart-panel">
        <h3 className="panel__title">Monthly breakdown</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="4 4" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip
              cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }}
              contentStyle={{
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: 12,
              }}
              formatter={(value, name) => {
                if (name === 'totalPkr') {
                  return [`${Number(value).toLocaleString()} PKR`, 'Revenue'];
                }
                return [value, 'Payments'];
              }}
            />
            <Bar dataKey="totalPkr" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card card--flush">
        <table className="data-table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Revenue</th>
              <th>Payments</th>
              <th>Avg / payment</th>
            </tr>
          </thead>
          <tbody>
            {[...revenue].reverse().map((r) => (
              <tr key={r.month}>
                <td>{r.month}</td>
                <td className="amount-cell">{r.totalPkr.toLocaleString()} PKR</td>
                <td>{r.paymentCount}</td>
                <td className="muted">
                  {r.paymentCount
                    ? `${Math.round(r.totalPkr / r.paymentCount).toLocaleString()} PKR`
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
