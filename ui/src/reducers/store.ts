import { configureStore } from '@reduxjs/toolkit';
import generate from './generate';
import model from './model';
import rvc from './rvc';
import rvcparams from './rvcparams';

export const store = configureStore({
    reducer: {
        generate,
        model,
        rvc,
        rvcparams
    },
    middleware: (defaultMiddleware) =>
        defaultMiddleware({ serializableCheck: false }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
