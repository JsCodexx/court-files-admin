const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5500').replace(
  /\/$/,
  ''
);

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function authHeaders(token: string | null): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: text };
  }
}

export async function apiRequest<T>(
  path: string,
  options: {
    method?: string;
    token?: string | null;
    body?: unknown;
  } = {}
): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, {
    method: options.method ?? 'GET',
    headers: authHeaders(options.token ?? null),
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const data = (await parseJson(res)) as Record<string, unknown>;
  if (!res.ok) {
    const message =
      (typeof data.message === 'string' && data.message) ||
      `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }
  return data as T;
}

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  barAddress: string;
  emailVerified: boolean;
  isActive: boolean;
  isSuperadmin: boolean;
  subscriptionStatus: string;
  subscriptionExpiresAt: string | null;
  createdAt: string;
  planId: string | null;
  subscriptionPeriodEnd: string | null;
};

export type AdminPayment = {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  planId: string;
  amountPkr: number;
  currency: string;
  status: string;
  provider: string;
  merchantOrderId: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminSubscription = {
  userId: string;
  userEmail: string;
  userName: string;
  planId: string;
  status: string;
  source: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  subscribedAt: string;
  userSubscriptionStatus: string;
  userSubscriptionExpiresAt: string | null;
};

export type RevenueMonth = {
  month: string;
  totalPkr: number;
  paymentCount: number;
};

export async function adminLogin(email: string, password: string) {
  return apiRequest<{
    ok: boolean;
    token: string;
    user: { name: string; email: string };
  }>('/admin/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

export async function fetchUsers(token: string) {
  return apiRequest<{ ok: boolean; users: AdminUser[] }>('/admin/users', {
    token,
  });
}

export async function setUserActive(
  token: string,
  userId: string,
  isActive: boolean
) {
  return apiRequest<{ ok: boolean; user: AdminUser }>(
    `/admin/users/${userId}/active`,
    { method: 'PATCH', token, body: { isActive } }
  );
}

export async function fetchPayments(token: string) {
  return apiRequest<{ ok: boolean; payments: AdminPayment[] }>(
    '/admin/payments',
    { token }
  );
}

export async function fetchSubscriptions(token: string) {
  return apiRequest<{ ok: boolean; subscriptions: AdminSubscription[] }>(
    '/admin/subscriptions',
    { token }
  );
}

export async function fetchPlanPrices(token: string) {
  return apiRequest<{
    ok: boolean;
    prices: { monthlyAmountPkr: number; yearlyAmountPkr: number };
  }>('/admin/plans/prices', { token });
}

export async function updatePlanPrices(
  token: string,
  monthlyAmountPkr: number,
  yearlyAmountPkr: number
) {
  return apiRequest<{
    ok: boolean;
    prices: { monthlyAmountPkr: number; yearlyAmountPkr: number };
  }>('/admin/plans/prices', {
    method: 'PUT',
    token,
    body: { monthlyAmountPkr, yearlyAmountPkr },
  });
}

export async function fetchRevenue(token: string, months = 12) {
  return apiRequest<{ ok: boolean; revenue: RevenueMonth[] }>(
    `/admin/revenue?months=${months}`,
    { token }
  );
}

export type AdminManualPaymentRequest = {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userPhone: string;
  planId: string;
  amountPkr: number;
  status: string;
  paidToMethod: string;
  transactionId: string;
  senderAccountName: string;
  senderAccountTitle: string;
  senderPhone: string;
  notes: string;
  adminNote: string;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
};

export async function fetchManualPaymentRequests(token: string) {
  return apiRequest<{ ok: boolean; requests: AdminManualPaymentRequest[] }>(
    '/admin/manual-payment-requests',
    { token }
  );
}

export async function approveManualPaymentRequest(
  token: string,
  id: string,
  adminNote = ''
) {
  return apiRequest<{ ok: boolean; request: AdminManualPaymentRequest }>(
    `/admin/manual-payment-requests/${id}/approve`,
    { method: 'POST', token, body: { adminNote } }
  );
}

export async function rejectManualPaymentRequest(
  token: string,
  id: string,
  adminNote = ''
) {
  return apiRequest<{ ok: boolean; request: AdminManualPaymentRequest }>(
    `/admin/manual-payment-requests/${id}/reject`,
    { method: 'POST', token, body: { adminNote } }
  );
}
