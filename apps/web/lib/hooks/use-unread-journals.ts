import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiClient } from '../api-client';

interface UnreadCountResponse {
  count: number;
}

export const useUnreadJournalCount = () => {
  return useQuery({
    queryKey: ['unread-journal-count'],
    queryFn: async () => {
      const response = await ApiClient.get<UnreadCountResponse>('/api/journal/unread/count');
      return response.count;
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
  });
};

export const useMarkJournalAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entryId: string) => {
      await ApiClient.post(`/api/journal/${entryId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unread-journal-count'] });
      queryClient.refetchQueries({ queryKey: ['unread-journal-count'] });
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
    },
  });
};
