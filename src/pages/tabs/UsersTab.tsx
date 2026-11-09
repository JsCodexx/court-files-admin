import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ApiError,
  fetchUsers,
  setUserActive,
  type AdminUser,
} from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { DataTable, formatShortDate, type Column } from '../../components/DataTable';
import { LoadingState } from '../../components/LoadingState';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { UserCell } from '../../components/UserCell';

export function UsersTab() {
  const { token } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetchUsers(token);
      setUsers(res.users);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleActive(user: AdminUser) {
    if (!token) return;
    setBusyId(user.id);
    try {
      const res = await setUserActive(token, user.id, !user.isActive);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? res.user : u)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Update failed.');
    } finally {
      setBusyId(null);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (filter === 'active' && !u.isActive) return false;
      if (filter === 'inactive' && u.isActive) return false;
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.includes(q)
      );
    });
  }, [users, query, filter]);

  const columns: Column<AdminUser>[] = [
    {
      key: 'user',
      header: 'User',
      render: (u) => <UserCell name={u.name} email={u.email} />,
    },
    { key: 'phone', header: 'Phone', render: (u) => u.phone },
    {
      key: 'status',
      header: 'Subscription',
      render: (u) => <StatusBadge status={u.subscriptionStatus} />,
    },
    {
      key: 'plan',
      header: 'Plan',
      render: (u) => (u.planId ? <StatusBadge status={u.planId} /> : '—'),
    },
    {
      key: 'expires',
      header: 'Expires',
      render: (u) => formatShortDate(u.subscriptionExpiresAt),
    },
    {
      key: 'active',
      header: 'Account',
      render: (u) => (
        <button
          type="button"
          className={
            u.isActive ? 'toggle-pill toggle-pill--on' : 'toggle-pill toggle-pill--off'
          }
          disabled={busyId === u.id}
          onClick={() => void toggleActive(u)}
        >
          {u.isActive ? 'Active' : 'Disabled'}
        </button>
      ),
    },
    {
      key: 'created',
      header: 'Joined',
      render: (u) => formatShortDate(u.createdAt),
    },
  ];

  if (loading) return <LoadingState label="Loading users…" />;

  return (
    <section className="page">
      <PageHeader
        title="Users"
        subtitle={`${users.length} registered advocates and clerks.`}
        actions={
          <button type="button" className="btn btn--secondary" onClick={() => void load()}>
            Refresh
          </button>
        }
      />
      {error ? <p className="banner banner--error">{error}</p> : null}

      <div className="toolbar card">
        <input
          className="search-input"
          type="search"
          placeholder="Search name, email, phone…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="chip-group" role="tablist" aria-label="Filter users">
          {(['all', 'active', 'inactive'] as const).map((key) => (
            <button
              key={key}
              type="button"
              className={filter === key ? 'chip chip--active' : 'chip'}
              onClick={() => setFilter(key)}
            >
              {key === 'all' ? 'All' : key === 'active' ? 'Active' : 'Disabled'}
            </button>
          ))}
        </div>
      </div>

      <p className="table-meta">
        Showing {filtered.length} of {users.length}
      </p>
      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(u) => u.id}
        emptyMessage="No users match your filters."
      />
    </section>
  );
}
