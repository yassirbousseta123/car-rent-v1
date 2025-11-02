import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { Renter } from '../types/domain';

export function useRenters() {
  return useQuery({
    queryKey: ['renters'],
    queryFn: api.renters.getAll,
  });
}

export function useRenter(id: string) {
  return useQuery({
    queryKey: ['renters', id],
    queryFn: () => api.renters.getById(id),
    enabled: !!id,
  });
}

export function useCreateRenter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.renters.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renters'] });
    },
  });
}

export function useUpdateRenter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Renter> }) => api.renters.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['renters'] });
      queryClient.invalidateQueries({ queryKey: ['renters', variables.id] });
    },
  });
}
