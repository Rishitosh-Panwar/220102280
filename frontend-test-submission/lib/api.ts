export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const base = process.env.NEXT_PUBLIC_API_BASE;
  const token = process.env.NEXT_PUBLIC_ACCESS_TOKEN;

  const res = await fetch(`${base}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}
