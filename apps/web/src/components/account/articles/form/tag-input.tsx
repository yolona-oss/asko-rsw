'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { api } from '@/lib/api/client';

interface TagStat {
    tag: string;
    count: number;
    totalViews: number;
}

interface TagInputProps {
    value: string;
    onChange: (value: string) => void;
}

export function TagInput({ value, onChange }: TagInputProps) {
    const [allTags, setAllTags] = useState<TagStat[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get<{ tags: TagStat[] }>('/articles/tags/stats');
                setAllTags(data.tags ?? []);
            } catch {
                // ignore
            }
        })();
    }, []);

    const currentTags = value.split(',').map((t) => t.trim()).filter(Boolean);
    const currentInput = value.split(',').pop()?.trim() ?? '';

    const suggestions = useMemo(() => {
        if (!currentInput) {
            return allTags.filter((t) => !currentTags.includes(t.tag)).slice(0, 8);
        }
        return allTags
            .filter((t) => t.tag.toLowerCase().includes(currentInput.toLowerCase()))
            .filter((t) => !currentTags.slice(0, -1).includes(t.tag))
            .slice(0, 8);
    }, [currentInput, allTags, currentTags]);

    // Reset active index when suggestions change
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActiveIndex(-1);
    }, [suggestions]);

    const selectTag = (tag: string) => {
        const parts = value.split(',').map((t) => t.trim()).filter(Boolean);
        // Replace the last (partial) entry with the selected tag
        if (currentInput) {
            parts[parts.length - 1] = tag;
        } else {
            parts.push(tag);
        }
        onChange(parts.join(', ') + ', ');
        setShowDropdown(false);
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showDropdown || suggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex((i) => (i + 1) % suggestions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
        } else if (e.key === 'Enter' && activeIndex >= 0) {
            e.preventDefault();
            selectTag(suggestions[activeIndex].tag);
        } else if (e.key === 'Escape') {
            setShowDropdown(false);
        }
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
                inputRef.current && !inputRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="relative max-w-[500px]">
            <input
                ref={inputRef}
                type="text"
                placeholder="ремонт, ASKO, обслуживание"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setShowDropdown(true)}
                onKeyDown={handleKeyDown}
                className="w-full px-3 py-2 text-sm border border-border-light/30 rounded bg-surface text-text-main outline-none focus:border-brand-red/50 transition-colors"
            />

            {showDropdown && suggestions.length > 0 && (
                <div
                    ref={dropdownRef}
                    className="absolute z-50 top-full left-0 right-0 mt-1 bg-surface border border-border-light/30 rounded shadow-lg max-h-[240px] overflow-y-auto"
                >
                    {suggestions.map((s, i) => (
                        <button
                            key={s.tag}
                            type="button"
                            onClick={() => selectTag(s.tag)}
                            className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 transition-colors ${
                                i === activeIndex ? 'bg-surface-secondary' : 'hover:bg-surface-hover'
                            }`}
                        >
                            <span className="text-text-main">{s.tag}</span>
                            <span className="flex items-center gap-2 text-xs text-text-sub shrink-0">
                                <span>{s.count} {s.count === 1 ? 'статья' : s.count < 5 ? 'статьи' : 'статей'}</span>
                                <span className="text-text-sub/50">&bull;</span>
                                <span>{s.totalViews} просм.</span>
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
