'use client';

import { useState, useCallback } from 'react';

export function useEntityDetail<T>() {
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const open = selectedItem !== null;
  const onClose = useCallback(() => setSelectedItem(null), []);
  const onRowClick = useCallback((item: T) => setSelectedItem(item), []);

  return { selectedItem, open, onClose, onRowClick };
}
