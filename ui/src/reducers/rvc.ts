import { createSlice } from '@reduxjs/toolkit';

const rvcReducer = createSlice({
    initialState: {
        file: undefined as unknown as File,
        result: '',
    },
    name: 'rvc',
    reducers: {
        setFile: (state, action) => {
            state.file = action.payload;
        },
        setResult: (state, action) => {
            state.result = action.payload;
        },
    },
});

export default rvcReducer.reducer;

export const { setFile, setResult } = rvcReducer.actions;
