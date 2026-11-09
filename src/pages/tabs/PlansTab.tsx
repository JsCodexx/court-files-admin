import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { ApiError, fetchPlanPrices, updatePlanPrices } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { LoadingState } from '../../components/LoadingState';
import { PageHeader } from '../../components/PageHeader';

export function PlansTab() {
  const { token } = useAuth();
  const [monthly, setMonthly] = useState('');
  const [yearly, setYearly] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetchPlanPrices(token);
      setMonthly(String(res.prices.monthlyAmountPkr));
      setYearly(String(res.prices.yearlyAmountPkr));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load prices.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const monthlyNum = parseInt(monthly, 10) || 0;
  const yearlyNum = parseInt(yearly, 10) || 0;
  const yearlyEquiv = monthlyNum * 12;
  const savings = useMemo(() => {
    if (!monthlyNum || !yearlyNum) return 0;
    return Math.max(0, yearlyEquiv - yearlyNum);
  }, [monthlyNum, yearlyNum, yearlyEquiv]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setMessage('');
    setError('');
    try {
      if (monthlyNum <= 0 || yearlyNum <= 0) {
        setError('Enter valid positive PKR amounts.');
        return;
      }
      await updatePlanPrices(token, monthlyNum, yearlyNum);
      setMessage('Prices saved — new checkouts use these amounts immediately.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState label="Loading plan prices…" />;

  return (
    <section className="page">
      <PageHeader
        title="Plan pricing"
        subtitle="Controls amounts returned by /api/payments/plans and checkout."
      />

      {error ? <p className="banner banner--error">{error}</p> : null}
      {message ? <p className="banner banner--success">{message}</p> : null}

      <div className="pricing-grid">
        <article className="pricing-card card">
          <p className="pricing-card__label">Monthly</p>
          <p className="pricing-card__price">
            {monthlyNum.toLocaleString()} <span>PKR</span>
          </p>
          <p className="pricing-card__meta">30 days full access</p>
        </article>
        <article className="pricing-card card pricing-card--featured">
          <p className="pricing-card__label">Yearly</p>
          <p className="pricing-card__price">
            {yearlyNum.toLocaleString()} <span>PKR</span>
          </p>
          <p className="pricing-card__meta">
            {savings > 0
              ? `Saves ${savings.toLocaleString()} PKR vs 12× monthly`
              : '365 days full access'}
          </p>
        </article>
      </div>

      <form className="card pricing-form" onSubmit={onSubmit}>
        <h3 className="panel__title">Edit amounts</h3>
        <div className="pricing-form__fields">
          <label className="field">
            <span>Monthly (PKR)</span>
            <input
              type="number"
              min={1}
              value={monthly}
              onChange={(e) => setMonthly(e.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>Yearly (PKR)</span>
            <input
              type="number"
              min={1}
              value={yearly}
              onChange={(e) => setYearly(e.target.value)}
              required
            />
          </label>
        </div>
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save pricing'}
        </button>
      </form>
    </section>
  );
}
