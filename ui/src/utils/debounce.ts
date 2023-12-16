import { debounce } from '@mui/material';
import { useState, useEffect } from 'react';

export const useDebounce = <T extends unknown>(val: T, delay: number): T => {
    const [result, setResult] = useState<T>(val);
    useEffect(() => {
        const df = debounce((f) => setResult(f), delay);
        df(val);
        return () => df.clear();
    }, [val, delay]);
    return result;
};
