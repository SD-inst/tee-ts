import { createSlice } from '@reduxjs/toolkit';

const rvcparams = createSlice({
    initialState: {
        pitch: 0,
        index: 0.75,
        filter_radius: 3,
        rms_mix_rate: 0.25,
        protect: 0.33,
    },
    name: 'rvcparams',
    reducers: {
        setParam: (state, action) => ({ ...state, ...action.payload }),
    },
});
export default rvcparams.reducer;

export const { setParam } = rvcparams.actions;
