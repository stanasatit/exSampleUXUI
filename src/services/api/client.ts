const defaultHeaders = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

export async function apiGet<TResponse>(url: string): Promise<TResponse> {
  const response = await fetch(url, {
    headers: defaultHeaders,
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json() as Promise<TResponse>;
}
