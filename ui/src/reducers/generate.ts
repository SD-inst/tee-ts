import { createSlice } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';

export const genReducer = createSlice({
    initialState: {
        params: {
            text: '',
            RVC: true,
            language: 'en',
            batch_size: 1,
        },
        audios: [] as string[],
    },
    name: 'generate',
    reducers: {
        setGenParam: (state, action) => {
            state.params = { ...state.params, ...action.payload };
        },
        appendAudio: (state, action) => {
            state.audios.push(action.payload);
        },
        clearAudio: (state) => ({ ...state, audios: [] }),
    },
});

export default genReducer.reducer;

export const useSetGenParam = () => {
    const dispatch = useDispatch();
    return (payload: any) => dispatch(genReducer.actions.setGenParam(payload));
};

export const { appendAudio, clearAudio } = genReducer.actions;
