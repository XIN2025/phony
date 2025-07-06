'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';

type EventHandler = (...args: unknown[]) => void;

export function useSocket(event: string, handler: EventHandler): Socket | null {
  const { data: session } = useSession();
  const handlerRef = useRef<EventHandler>(handler);
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  handlerRef.current = handler;

  useEffect(() => {
    if (!session?.user?.token) {
      return;
    }

    if (!socketRef.current) {
      socketRef.current = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
        auth: {
          token: session.user.token,
          userId: session.user.id,
        },
        transports: ['websocket'],
        timeout: 20000,
        forceNew: true,
      });

      socketRef.current.on('connect', () => {
        setIsConnected(true);
        setTimeout(() => {
          if (socketRef.current?.connected) {
            socketRef.current.emit('userConnected', { userId: session.user.id });
          }
        }, 500);
      });

      socketRef.current.on('disconnect', (reason) => {
        setIsConnected(false);
      });

      socketRef.current.on('connect_error', (error) => {
        setIsConnected(false);
      });

      socketRef.current.on('error', (error) => {
        // Handle socket errors silently in production
      });
    }

    const socket = socketRef.current;

    const eventListener = (...args: unknown[]) => {
      if (handlerRef.current) {
        handlerRef.current(...args);
      }
    };

    socket.on(event, eventListener);

    return () => {
      socket.off(event, eventListener);
    };
  }, [event, session?.user?.token]);

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, []);

  return socketRef.current;
}
