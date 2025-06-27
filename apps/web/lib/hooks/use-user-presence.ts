'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSocket } from './use-socket';
import { Socket } from 'socket.io-client';

type UserStatus = 'online' | 'offline' | 'unknown';

interface UserPresence {
  userId: string;
  status: UserStatus;
  lastSeen?: Date;
}

export function useUserPresence() {
  const [userStatuses, setUserStatuses] = useState<Map<string, UserPresence>>(new Map());
  const socketRef = useRef<Socket | null>(null);
  const requestedUsers = useRef<Set<string>>(new Set());

  // Listen for user status changes
  const socket = useSocket('userStatusChange', (data: unknown) => {
    const statusData = data as { userId: string; status: UserStatus; timestamp: string };
    setUserStatuses((prev) => {
      const newMap = new Map(prev);
      newMap.set(statusData.userId, {
        userId: statusData.userId,
        status: statusData.status,
        lastSeen: statusData.status === 'offline' ? new Date(statusData.timestamp) : undefined,
      });
      return newMap;
    });
  });

  socketRef.current = socket;

  // Listen for individual user status responses
  useSocket('userStatus', (data: unknown) => {
    const statusData = data as { userId: string; status: UserStatus; timestamp: string };
    setUserStatuses((prev) => {
      const newMap = new Map(prev);
      newMap.set(statusData.userId, {
        userId: statusData.userId,
        status: statusData.status,
        lastSeen: statusData.status === 'offline' ? new Date(statusData.timestamp) : undefined,
      });
      return newMap;
    });
  });

  // Listen for online users list
  useSocket('onlineUsers', (data: unknown) => {
    const usersData = data as { userIds: string[]; timestamp: string };
    setUserStatuses((prev) => {
      const newMap = new Map(prev);

      // Only mark users in the online list as online
      usersData.userIds.forEach((userId) => {
        newMap.set(userId, {
          userId,
          status: 'online',
          lastSeen: undefined,
        });
      });

      return newMap;
    });
  });

  const getUserStatus = useCallback(
    (userId: string): UserStatus => {
      const status = userStatuses.get(userId)?.status || 'unknown';
      return status;
    },
    [userStatuses],
  );

  const isUserOnline = useCallback(
    (userId: string): boolean => {
      return getUserStatus(userId) === 'online';
    },
    [getUserStatus],
  );

  const requestUserStatus = useCallback((userId: string) => {
    if (socketRef.current?.connected && userId) {
      socketRef.current.emit('getUserStatus', { userId });
    }
  }, []);

  const requestOnlineUsers = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('getOnlineUsers');
    }
  }, []);

  // Auto-request online users on mount and when socket connects
  useEffect(() => {
    if (socketRef.current?.connected) {
      requestOnlineUsers();
    }
  }, [socketRef.current?.connected, requestOnlineUsers]);

  return {
    getUserStatus,
    isUserOnline,
    requestUserStatus,
    requestOnlineUsers,
    userStatuses: Array.from(userStatuses.values()),
  };
}
