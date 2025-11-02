const BASE_URL = '/api';

export class ApiError extends Error {
  public status: number;
  public statusText: string;
  public data?: any;

  constructor(status: number, statusText: string, data?: any) {
    super(`API Error ${status}: ${statusText}`);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.data = data;
  }
}

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new ApiError(response.status, response.statusText, data);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  vehicles: {
    getAll: () => fetchJSON<any[]>('/vehicles'),
    getById: (id: string) => fetchJSON<any>(`/vehicles/${id}`),
    create: (data: any) => fetchJSON<any>('/vehicles', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchJSON<any>(`/vehicles/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => fetchJSON<void>(`/vehicles/${id}`, { method: 'DELETE' }),
  },
  renters: {
    getAll: () => fetchJSON<any[]>('/renters'),
    getById: (id: string) => fetchJSON<any>(`/renters/${id}`),
    create: (data: any) => fetchJSON<any>('/renters', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchJSON<any>(`/renters/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },
  bookings: {
    getAll: () => fetchJSON<any[]>('/bookings'),
    getById: (id: string) => fetchJSON<any>(`/bookings/${id}`),
    create: (data: any) => fetchJSON<any>('/bookings', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchJSON<any>(`/bookings/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => fetchJSON<void>(`/bookings/${id}`, { method: 'DELETE' }),
  },
  documents: {
    getAll: (params?: { bookingId?: string; vehicleId?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return fetchJSON<any[]>(`/documents${query ? `?${query}` : ''}`);
    },
    create: (data: any) => fetchJSON<any>('/documents', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => fetchJSON<void>(`/documents/${id}`, { method: 'DELETE' }),
  },
  upload: async (file: File): Promise<{ url: string; fileName: string; mime: string; size: number }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new ApiError(response.status, response.statusText, data);
    }

    return response.json();
  },
};
