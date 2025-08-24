"use client"

import React, { useEffect, useState } from 'react';
import { getDatabase } from '@/lib/db/singleton';

interface DatabaseProviderProps {
  children: React.ReactNode;
}

export function DatabaseProvider({ children }: DatabaseProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initDatabase = async () => {
      try {
        await getDatabase();
        if (mounted) {
          setIsInitialized(true);
        }
      } catch (err) {
        console.error('Failed to initialize database:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Database initialization failed');
        }
      }
    };

    initDatabase();

    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">データベースエラー</h2>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">データベースを初期化しています...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}