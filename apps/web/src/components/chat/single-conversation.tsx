'use client';

import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/index';
import {
    selectConversationById,
    selectTypingUsersForConversation,
    selectParticipantNames,
    selectParticipantRoles,
    selectReadPositions,
    setActiveConversation,
    fetchConversation,
} from '@/store/chat';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { TypingIndicator } from './typing-indicator';

interface SingleConversationProps {
    conversationId: string;
    currentUserId: string;
    height?: string;
    notParticipantMessage?: string;
}

export function SingleConversation({
    conversationId,
    currentUserId,
    height = '400px',
    notParticipantMessage = 'Вы не подключены к этому чату.',
}: SingleConversationProps) {
    const dispatch = useAppDispatch();

    const conversation = useAppSelector(state => selectConversationById(state, conversationId));
    const typingUserIds = useAppSelector(state => selectTypingUsersForConversation(state, conversationId, currentUserId));
    const participantNames = useAppSelector(selectParticipantNames);
    const participantRoles = useAppSelector(selectParticipantRoles);
    const readPositions = useAppSelector(selectReadPositions);

    useEffect(() => {
        dispatch(fetchConversation(conversationId));
        dispatch(setActiveConversation(conversationId));
        return () => {
            dispatch(setActiveConversation(null));
        };
    }, [conversationId, dispatch]);

    const typingNames: string[] = typingUserIds.map(
        userId => participantNames[userId] ?? 'Пользователь',
    );

    if (!conversation) return <p className="text-xs text-text-sub p-4">Загрузка чата...</p>;

    const isParticipant = conversation.participants.some(p => p.userId === currentUserId);
    if (!isParticipant) {
        return <p className="text-sm text-text-sub p-4">{notParticipantMessage}</p>;
    }

    return (
        <div className="flex flex-col" style={{ height }}>
            <MessageList
                conversationId={conversationId}
                currentUserId={currentUserId}
                isGroup={conversation.type === 'group'}
                participantNames={participantNames}
                participantRoles={participantRoles}
                readPositions={readPositions}
                participants={conversation.participants}
            />
            <TypingIndicator userNames={typingNames} />
            <MessageInput conversationId={conversationId} />
        </div>
    );
}
