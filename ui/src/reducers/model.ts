import { createSlice } from '@reduxjs/toolkit';

const modelReducer = createSlice({
    initialState: {
        name: '',
        sample: '',
    },
    name: 'model',
    reducers: {
        setModel: (state, action) => {
            state.name = action.payload;
        },
        setSample: (state, action) => {
            state.sample = action.payload;
        },
    },
});

export const { setModel, setSample } = modelReducer.actions;

export default modelReducer.reducer;
