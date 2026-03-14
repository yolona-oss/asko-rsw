'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppDispatch } from '@/store';
import { setAccessToken } from '@/store/auth-slice';
import { setRefreshTokenCookie, getRefreshTokenFromCookie } from './cookie-utils';
import { Role } from '@asko/shared/client';

export interface TokenInfo {
  refreshTkn: string;
  role: Role;
  timestamp: number;
}

const DB_NAME = 'DevToolbarDB';
const STORE_NAME = 'tokens';
const DB_VERSION = 1;

export function useTokens() {
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const dispatch = useAppDispatch();
  const dbRef = useRef<IDBDatabase | null>(null);
  const scrapedTokensRef = useRef<Set<string>>(new Set());

  // Initialize IndexedDB
  useEffect(() => {
    const initDB = async () => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB');
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, {
            keyPath: 'refreshTkn'
          });
          store.createIndex('role', 'role', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        dbRef.current = (event.target as IDBOpenDBRequest).result;
        loadTokens();
      };
    };

    initDB();

    return () => {
      if (dbRef.current) {
        dbRef.current.close();
      }
    };
  }, []);

  const loadTokens = useCallback(() => {
    if (!dbRef.current) return;

    const transaction = dbRef.current.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      // Sort by timestamp descending (newest first)
      const sortedTokens = request.result.sort((a, b) =>
        (b.timestamp || 0) - (a.timestamp || 0)
      );
      setTokens(sortedTokens);
    };
  }, []);

  const loadTokensFromSession = useCallback((refreshTkn: string, role: Role) => {
    if (!dbRef.current || !refreshTkn || scrapedTokensRef.current.has(refreshTkn)) {
      return;
    }

    // Mark as scraped to prevent duplicates
    scrapedTokensRef.current.add(refreshTkn);

    const transaction = dbRef.current.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const getRequest = store.get(refreshTkn);

    getRequest.onsuccess = () => {
      if (getRequest.result) {
        // Token exists, update timestamp
        const updateTransaction = dbRef.current!.transaction(STORE_NAME, 'readwrite');
        const updateStore = updateTransaction.objectStore(STORE_NAME);
        updateStore.put({
          ...getRequest.result,
          timestamp: Date.now()
        });

        updateTransaction.oncomplete = () => {
          loadTokens();
        };
      } else {
        // Add new token
        const writeTransaction = dbRef.current!.transaction(STORE_NAME, 'readwrite');
        const writeStore = writeTransaction.objectStore(STORE_NAME);
        writeStore.add({
          refreshTkn,
          role,
          timestamp: Date.now()
        });

        writeTransaction.oncomplete = () => {
          loadTokens();
        };
      }
    };
  }, [loadTokens]);

  const addToken = useCallback(async (refreshTkn: string, role: Role) => {
    if (!dbRef.current) return;

    const transaction = dbRef.current.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const getRequest = store.get(refreshTkn);

    getRequest.onsuccess = () => {
      if (getRequest.result) {
        console.log('Token already exists');
        return;
      }

      const writeTransaction = dbRef.current!.transaction(STORE_NAME, 'readwrite');
      const writeStore = writeTransaction.objectStore(STORE_NAME);
      writeStore.add({
        refreshTkn,
        role,
        timestamp: Date.now()
      });

      writeTransaction.oncomplete = () => {
        loadTokens();
        // Add to scraped set to prevent duplicate auto-scraping
        scrapedTokensRef.current.add(refreshTkn);
      };
    };
  }, [loadTokens]);

  const switchToToken = useCallback((refreshTkn: string) => {
    // Find the token in our list to get its role
    const tokenInfo = tokens.find(t => t.refreshTkn === refreshTkn);

    // Set the refresh token in cookie
    setRefreshTokenCookie(refreshTkn);

    // You might want to also set an access token or trigger a token exchange
    // For now, we'll just set a placeholder
    dispatch(setAccessToken(`switched_${Date.now()}`));

    // Refresh the page to apply the new token
    window.location.reload();
  }, [dispatch, tokens]);

  // Initial load from cookie on mount
  useEffect(() => {
    const currentToken = getRefreshTokenFromCookie();
    if (currentToken && dbRef.current) {
      // You might want to mark the current token specially
      console.log('Current session token:', currentToken);
    }
  }, []);

  return {
    tokens,
    addToken,
    switchToToken,
    loadTokensFromSession,
  };
}
