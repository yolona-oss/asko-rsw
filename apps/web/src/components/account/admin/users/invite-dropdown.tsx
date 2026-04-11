'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { DropdownMenu } from '@asko/ui';
import type { DropdownMenuEntry } from '@asko/ui';
import { InviteCreatePopup } from './invite-create-popup';
import { InviteListPopup } from './invite-list-popup';

export function InviteDropdown() {
  const [createOpen, setCreateOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);

  const items: DropdownMenuEntry[] = [
    {
      key: 'create',
      label: 'Создать приглашение',
      onClick: () => setCreateOpen(true),
    },
    {
      key: 'list',
      label: 'Все приглашения',
      onClick: () => setListOpen(true),
    },
  ];

  return (
    <>
      <DropdownMenu
        trigger={
          <button
            type="button"
            className="flex items-center gap-1 bg-success text-text-on-dark text-sm font-medium px-2 py-1 hover:bg-success-deep cursor-pointer whitespace-nowrap"
          >
            Выдать доступ
            <ChevronDown className="w-4 h-4" />
          </button>
        }
        items={items}
        placement="bottom-end"
      />

      {createOpen && (
        <InviteCreatePopup onClose={() => setCreateOpen(false)} />
      )}

      {listOpen && (
        <InviteListPopup onClose={() => setListOpen(false)} />
      )}
    </>
  );
}
