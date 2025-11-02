import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

export function useDocuments(params?: { bookingId?: string; vehicleId?: string }) {
  return useQuery({
    queryKey: ['documents', params],
    queryFn: () => api.documents.getAll(params),
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.documents.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.documents.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export function useUploadFile() {
  return useMutation({
    mutationFn: api.upload,
  });
}
