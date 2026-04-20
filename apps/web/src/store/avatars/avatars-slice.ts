import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { usersApi } from '@/lib/api/users';

export interface AvatarsState {
    urls: Record<string, string | null>;
    pending: Record<string, boolean>;
}

const initialState: AvatarsState = {
    urls: {},
    pending: {},
};

export const fetchAvatars = createAsyncThunk(
    'avatars/fetch',
    async (userIds: string[], { getState }) => {
        const state = getState() as { avatars: AvatarsState };
        const toFetch = userIds.filter(
            (id) => id && !(id in state.avatars.urls) && !state.avatars.pending[id],
        );
        if (toFetch.length === 0) return [];

        const results = await Promise.all(
            toFetch.map(async (id) => {
                const url = await usersApi.getAvatarUrl(id);
                return { id, url };
            }),
        );
        return results;
    },
);

const avatarsSlice = createSlice({
    name: 'avatars',
    initialState,
    reducers: {
        setAvatar(state, action: PayloadAction<{ id: string; url: string | null }>) {
            state.urls[action.payload.id] = action.payload.url;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(fetchAvatars.pending, (state, action) => {
            for (const id of action.meta.arg) {
                if (!(id in state.urls)) state.pending[id] = true;
            }
        });
        builder.addCase(fetchAvatars.fulfilled, (state, action) => {
            for (const { id, url } of action.payload) {
                state.urls[id] = url;
                delete state.pending[id];
            }
        });
        builder.addCase(fetchAvatars.rejected, (state, action) => {
            for (const id of action.meta.arg) {
                delete state.pending[id];
            }
        });
    },
});

export const { setAvatar } = avatarsSlice.actions;

export const selectAvatarUrls = (state: { avatars: AvatarsState }) => state.avatars.urls;

export default avatarsSlice.reducer;
