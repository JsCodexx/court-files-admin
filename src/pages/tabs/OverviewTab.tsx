import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ApiError,
  fetchPayments,
  fetchRevenue,
  fetchUsers,
} from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { LoadingState } from '../../components/LoadingState';
import { PageHeader } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { formatDate } from '../../components/DataTable';

export function OverviewTab() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [userCount, setUserCount] = useState(0);
  const [activeSubs, setActiveSubs] = useState(0);
  const [paidTotal, setPaidTotal] = useState(0);
  const [revenue12, setRevenue12] = useState(0);
  const [chart, setChart] = useState<{ month: string; total: number }[]>([]);
  const [recentPaid, setRecentPaid] = useState<
    { email: string; amount: number; plan: string; when: string }[]
  >([]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const [usersRes, paymentsRes, revenueRes] = await Promise.all([
        fetchUsers(token),
        fetchPayments(token),
        fetchRevenue(token, 12),
      ]);

      const users = usersRes.users;
      setUserCount(users.length);
      setActiveSubs(
        users.filter(
          (u) =>
            u.subscriptionStatus === 'active' ||
            u.subscriptionStatus === 'grace'
        ).length
      );

      const paid = paymentsRes.payments.filter((p) => p.status === 'paid');
      setPaidTotal(paid.reduce((s, p) => s + p.amountPkr, 0));
      setRecentPaid(
        paid.slice(0, 5).map((p) => ({
          email: p.userEmail,
          amount: p.amountPkr,
          plan: p.planId,
          when: p.createdAt,
        }))
      );

      const rev = revenueRes.revenue;
      setRevenue12(rev.reduce((s, r) => s + r.totalPkr, 0));
      setChart(
        rev.map((r) => ({
          month: r.month.slice(5),
          total: r.totalPkr,
        }))
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load overview.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const inactiveUsers = useMemo(
    () => (loading ? 0 : Math.max(0, userCount - activeSubs)),
    [loading, userCount, activeSubs]
  );

  if (loading) return <LoadingState label="Loading dashboard…" />;

  return (
    <section className="page">
      <PageHeader
        title="Overview"
        subtitle="Court Files platform snapshot at a glance."
        actions={
          <button type="button" className="btn btn--secondary" onClick={() => void load()}>
            Refresh
          </button>
        }
      />
      {error ? <p className="banner banner--error">{error}</p> : null}

      <div className="stat-grid">
        <StatCard
          label="Registered users"
          value={userCount.toLocaleString()}
          hint={`${activeSubs} with active or grace access`}
          tone="accent"
        />
        <StatCard
          label="Revenue (12 mo)"
          value={`${revenue12.toLocaleString()} PKR`}
          hint="Paid gateway settlements"
          tone="success"
        />
        <StatCard
          label="Lifetime paid (listed)"
          value={`${paidTotal.toLocaleString()} PKR`}
          hint="From recent payments export"
        />
        <StatCard
          label="Needs attention"
          value={inactiveUsers.toLocaleString()}
          hint="No active / grace subscription"
          tone="warn"
        />
      </div>

      <div className="overview-grid">
        <div className="panel chart-panel">
          <h3 className="panel__title">Monthly revenue</h3>
          <div className="chart-panel__body">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chart}>
                <defs>
                  <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `${v}`} />
                <Tooltip
                  contentStyle={{
                    background: '#111827',
                    border: '1px solid #334155',
                    borderRadius: 10,
                  }}
                  formatter={(v) => [`${Number(v).toLocaleString()} PKR`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#818cf8"
                  fill="url(#revFill)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <div className="panel__head">
            <h3 className="panel__title">Recent payments</h3>
            <Link className="text-link" to="/payments">
              View all
            </Link>
          </div>
          <ul className="activity-list">
            {recentPaid.length === 0 ? (
              <li className="activity-list__empty">No paid payments yet.</li>
            ) : (
              recentPaid.map((p) => (
                <li key={`${p.email}-${p.when}`} className="activity-item">
                  <div>
                    <p className="activity-item__primary">{p.email}</p>
                    <p className="activity-item__meta">
                      <StatusBadge status={p.plan} /> · {formatDate(p.when)}
                    </p>
                  </div>
                  <span className="activity-item__amount">
                    {p.amount.toLocaleString()} PKR
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="quick-links">
        <Link to="/users" className="quick-link-card">
          <span className="quick-link-card__title">Manage users</span>
          <span className="quick-link-card__desc">Activate accounts & view plans</span>
        </Link>
        <Link to="/plans" className="quick-link-card">
          <span className="quick-link-card__title">Plan pricing</span>
          <span className="quick-link-card__desc">Update monthly & yearly PKR</span>
        </Link>
        <Link to="/subscriptions" className="quick-link-card">
          <span className="quick-link-card__title">Subscriptions</span>
          <span className="quick-link-card__desc">Period ends & expiries</span>
        </Link>
      </div>
    </section>
  );
}
