/** Module-level tracking of which conversation the user is currently viewing. */
let activeId: string | null = null;

export function setActiveConversation(id: string | null) {
  activeId = id;
}

export function getActiveConversation(): string | null {
  return activeId;
}
