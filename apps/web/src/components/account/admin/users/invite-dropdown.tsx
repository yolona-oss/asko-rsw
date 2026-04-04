'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { InviteCreatePopup } from './invite-create-popup';
import { InviteListPopup } from './invite-list-popup';

export function InviteDropdown() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="flex items-center gap-1 bg-[#179242] text-[#f1f1f1] text-sm font-medium px-2 py-1 hover:bg-[#147a38] cursor-pointer whitespace-nowrap"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        Выдать доступ
        <ChevronDown className="w-4 h-4" />
      </button>

      {/* Menu */}
      {menuOpen && (
        <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-border-light shadow-lg min-w-[200px]">
          <button
            type="button"
            className="w-full text-left px-4 py-2.5 text-sm text-[#323232] hover:bg-[#f6f6f8] cursor-pointer"
            onClick={() => { setMenuOpen(false); setCreateOpen(true); }}
          >
            Создать приглашение
          </button>
          <button
            type="button"
            className="w-full text-left px-4 py-2.5 text-sm text-[#323232] hover:bg-[#f6f6f8] cursor-pointer"
            onClick={() => { setMenuOpen(false); setListOpen(true); }}
          >
            Все приглашения
          </button>
        </div>
      )}

      {/* Create invitation popup */}
      {createOpen && (
        <InviteCreatePopup onClose={() => setCreateOpen(false)} />
      )}

      {/* List invitations popup */}
      {listOpen && (
        <InviteListPopup onClose={() => setListOpen(false)} />
      )}
    </div>
  );
}
