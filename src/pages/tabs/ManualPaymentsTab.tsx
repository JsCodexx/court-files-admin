import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ApiError,
  approveManualPaymentRequest,
  fetchManualPaymentRequests,
  rejectManualPaymentRequest,
  type AdminManualPaymentRequest,
} from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import {
  DataTable,
  formatDate,
  formatShortDate,
  type Column,
} from '../../components/DataTable';
import { LoadingState } from '../../components/LoadingState';
import { PageHeader } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { UserCell } from '../../components/UserCell';

type Filter = 'all' | 'pending' | 'approved' | 'rejected';

type DetailModalState = {
  request: AdminManualPaymentRequest;
  reviewAction: 'approve' | 'reject' | null;
  note: string;
};

function planLabel(planId: string) {
  if (planId === 'monthly') return 'Monthly';
  if (planId === 'yearly') return 'Yearly';
  return planId;
}

function methodLabel(method: string) {
  if (method === 'easypaisa') return 'Easypaisa';
  if (method === 'jazzcash') return 'JazzCash';
  if (method === 'bank') return 'Bank';
  return method;
}

function PaymentDetailBody({ request }: { request: AdminManualPaymentRequest }) {
  return (
    <>
      <p className="modal__section-title">Customer</p>
      <dl className="detail-dl">
        <div className="detail-dl__row">
          <dt>Name</dt>
          <dd>{request.userName || '—'}</dd>
        </div>
        <div className="detail-dl__row">
          <dt>Email</dt>
          <dd dir="ltr">{request.userEmail || '—'}</dd>
        </div>
        <div className="detail-dl__row">
          <dt>Phone</dt>
          <dd dir="ltr">{request.userPhone || '—'}</dd>
        </div>
      </dl>

      <p className="modal__section-title">Payment</p>
      <dl className="detail-dl">
        <div className="detail-dl__row">
          <dt>Plan</dt>
          <dd>
            {planLabel(request.planId)} ·{' '}
            <span className="amount-cell">
              {request.amountPkr.toLocaleString()} PKR
            </span>
          </dd>
        </div>
        <div className="detail-dl__row">
          <dt>Paid to</dt>
          <dd>{methodLabel(request.paidToMethod)}</dd>
        </div>
        <div className="detail-dl__row">
          <dt>Transaction ID</dt>
          <dd>
            <code className="mono">{request.transactionId}</code>
          </dd>
        </div>
        <div className="detail-dl__row">
          <dt>Status</dt>
          <dd>
            <StatusBadge status={request.status} />
          </dd>
        </div>
        <div className="detail-dl__row">
          <dt>Submitted</dt>
          <dd>{formatDate(request.createdAt)}</dd>
        </div>
        {request.reviewedAt ? (
          <div className="detail-dl__row">
            <dt>Reviewed</dt>
            <dd>{formatDate(request.reviewedAt)}</dd>
          </div>
        ) : null}
      </dl>

      <p className="modal__section-title">Sender</p>
      <dl className="detail-dl">
        <div className="detail-dl__row">
          <dt>Account name</dt>
          <dd>{request.senderAccountName || '—'}</dd>
        </div>
        <div className="detail-dl__row">
          <dt>Account title</dt>
          <dd>{request.senderAccountTitle || '—'}</dd>
        </div>
        <div className="detail-dl__row">
          <dt>Mobile</dt>
          <dd dir="ltr">{request.senderPhone || '—'}</dd>
        </div>
        <div className="detail-dl__row">
          <dt>Customer note</dt>
          <dd>{request.notes?.trim() ? request.notes : '—'}</dd>
        </div>
      </dl>

      {request.adminNote ? (
        <>
          <p className="modal__section-title">Admin note</p>
          <p className="modal__summary">{request.adminNote}</p>
        </>
      ) : null}
    </>
  );
}

export function ManualPaymentsTab() {
  const { token } = useAuth();
  const [rows, setRows] = useState<AdminManualPaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('pending');
  const [detailModal, setDetailModal] = useState<DetailModalState | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetchManualPaymentRequests(token);
      setRows(res.requests);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Failed to load manual payments.'
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(
    () => ({
      all: rows.length,
      pending: rows.filter((r) => r.status === 'pending').length,
      approved: rows.filter((r) => r.status === 'approved').length,
      rejected: rows.filter((r) => r.status === 'rejected').length,
    }),
    [rows]
  );

  const pendingVolume = useMemo(
    () =>
      rows
        .filter((r) => r.status === 'pending')
        .reduce((sum, r) => sum + r.amountPkr, 0),
    [rows]
  );

  const filtered = useMemo(() => {
    if (filter === 'all') return rows;
    return rows.filter((r) => r.status === filter);
  }, [rows, filter]);

  const openDetail = (request: AdminManualPaymentRequest) => {
    setSuccess('');
    setDetailModal({ request, reviewAction: null, note: '' });
  };

  const closeDetail = () => {
    if (busyId) return;
    setDetailModal(null);
  };

  const startReview = (action: 'approve' | 'reject') => {
    setDetailModal((m) => (m ? { ...m, reviewAction: action, note: '' } : m));
  };

  const submitReview = async () => {
    if (!token || !detailModal?.reviewAction) return;
    const { request, reviewAction, note } = detailModal;
    setBusyId(request.id);
    setError('');
    setSuccess('');
    try {
      if (reviewAction === 'approve') {
        await approveManualPaymentRequest(token, request.id, note.trim());
        setSuccess('Payment approved and subscription activated.');
      } else {
        await rejectManualPaymentRequest(token, request.id, note.trim());
        setSuccess('Request rejected. The customer will see your note in the app.');
      }
      setDetailModal(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Action failed.');
    } finally {
      setBusyId(null);
    }
  };

  const columns: Column<AdminManualPaymentRequest>[] = [
    {
      key: 'user',
      header: 'Customer',
      render: (r) => (
        <UserCell
          name={r.userName || '—'}
          email={r.userEmail || r.userPhone || '—'}
        />
      ),
    },
    {
      key: 'plan',
      header: 'Plan',
      render: (r) => (
        <span className="amount-cell">
          {planLabel(r.planId)} · {r.amountPkr.toLocaleString()} PKR
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'created',
      header: 'Submitted',
      render: (r) => formatShortDate(r.createdAt),
    },
    {
      key: 'actions',
      header: '',
      className: 'data-table__actions',
      render: (r) => (
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          onClick={() => openDetail(r)}
        >
          View
        </button>
      ),
    },
  ];

  const filterLabels: Record<Filter, string> = {
    pending: 'Pending review',
    approved: 'Approved',
    rejected: 'Rejected',
    all: 'All requests',
  };

  if (loading) return <LoadingState label="Loading manual payment requests…" />;

  const modal = detailModal;
  const inReview = modal?.reviewAction != null;
  const isPending = modal?.request.status === 'pending';

  return (
    <section className="page">
      <PageHeader
        title="Manual payments"
        subtitle="Review transfer proofs — open a row to see full details and approve or reject."
        actions={
          <button type="button" className="btn btn--secondary" onClick={() => void load()}>
            Refresh
          </button>
        }
      />

      {error ? <p className="banner banner--error">{error}</p> : null}
      {success ? <p className="banner banner--success">{success}</p> : null}

      <div className="stat-grid stat-grid--compact">
        <StatCard
          label="Awaiting review"
          value={counts.pending.toLocaleString()}
          tone="warn"
          hint={
            pendingVolume > 0
              ? `${pendingVolume.toLocaleString()} PKR pending`
              : undefined
          }
        />
        <StatCard
          label="Approved"
          value={counts.approved.toLocaleString()}
          tone="success"
        />
        <StatCard
          label="Rejected"
          value={counts.rejected.toLocaleString()}
          tone="danger"
        />
        <StatCard label="Total requests" value={counts.all.toLocaleString()} tone="accent" />
      </div>

      <div className="toolbar">
        <div className="chip-group chip-group--wrap">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
            <button
              key={f}
              type="button"
              className={filter === f ? 'chip chip--active' : 'chip'}
              onClick={() => setFilter(f)}
            >
              {filterLabels[f]} ({counts[f]})
            </button>
          ))}
        </div>
      </div>

      <p className="table-meta">
        Showing {filtered.length.toLocaleString()} of {rows.length.toLocaleString()}{' '}
        {filter === 'all' ? 'requests' : filterLabels[filter].toLowerCase()}
      </p>

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(r) => r.id}
        emptyMessage={
          filter === 'pending'
            ? 'No manual payments waiting for review.'
            : 'No requests match this filter.'
        }
      />

      {modal ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={closeDetail}
        >
          <div
            className="modal modal--lg"
            role="dialog"
            aria-labelledby="manual-detail-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="manual-detail-title" className="modal__title">
              {inReview
                ? modal.reviewAction === 'approve'
                  ? 'Approve payment'
                  : 'Reject request'
                : 'Payment request details'}
            </h3>
            {!inReview ? (
              <p className="modal__lede">
                Verify transaction ID and sender details against your bank or wallet
                statement.
              </p>
            ) : (
              <p className="modal__lede">
                {modal.reviewAction === 'approve'
                  ? 'This activates the customer plan after you confirm.'
                  : 'The customer will see this as rejected in the app.'}
              </p>
            )}

            {!inReview ? (
              <PaymentDetailBody request={modal.request} />
            ) : (
              <>
                <div className="modal__summary">
                  <strong>{modal.request.userName || modal.request.userEmail}</strong>
                  <br />
                  {planLabel(modal.request.planId)} ·{' '}
                  {modal.request.amountPkr.toLocaleString()} PKR ·{' '}
                  <code className="mono">{modal.request.transactionId}</code>
                </div>
                <label className="field" htmlFor="admin-note">
                  <span>
                    {modal.reviewAction === 'approve'
                      ? 'Note to customer (optional)'
                      : 'Reason for rejection (optional)'}
                  </span>
                  <textarea
                    id="admin-note"
                    value={modal.note}
                    onChange={(e) =>
                      setDetailModal((m) =>
                        m ? { ...m, note: e.target.value } : m
                      )
                    }
                    placeholder={
                      modal.reviewAction === 'approve'
                        ? 'e.g. Verified on Easypaisa — welcome aboard.'
                        : 'e.g. Amount or TID did not match our records.'
                    }
                  />
                </label>
              </>
            )}

            <div className="modal__actions">
              {!inReview ? (
                <>
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={closeDetail}
                  >
                    Close
                  </button>
                  {isPending ? (
                    <>
                      <button
                        type="button"
                        className="btn btn--danger btn--sm"
                        onClick={() => startReview('reject')}
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        className="btn btn--success btn--sm"
                        onClick={() => startReview('approve')}
                      >
                        Approve
                      </button>
                    </>
                  ) : null}
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn--ghost"
                    disabled={Boolean(busyId)}
                    onClick={() =>
                      setDetailModal((m) =>
                        m ? { ...m, reviewAction: null, note: '' } : m
                      )
                    }
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className={
                      modal.reviewAction === 'approve'
                        ? 'btn btn--primary'
                        : 'btn btn--danger'
                    }
                    disabled={busyId === modal.request.id}
                    onClick={() => void submitReview()}
                  >
                    {busyId === modal.request.id
                      ? 'Saving…'
                      : modal.reviewAction === 'approve'
                        ? 'Approve & activate'
                        : 'Reject request'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
