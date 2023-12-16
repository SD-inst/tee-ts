import { createContext, useContext, useState } from 'react';

type params = {
    text: string;
    batch_size: number;
    RVC: boolean;
    model: string;
    sample: string;
    audios: string[];
    language: string;
};

type value = {
    genParams: Partial<params>;
    setGenParams: (p: Partial<params>) => void;
};

const GenerationContext = createContext<value>({
    genParams: {},
    setGenParams: (_) => {},
});

export const GenerationContextProvider = (props: any) => {
    const [genParams, setGenParams] = useState({
        RVC: true,
        batch_size: 1,
        language: 'en',
    });
    return (
        <GenerationContext.Provider
            value={{
                genParams,
                setGenParams: (p: Partial<params>) =>
                    setGenParams((params) => ({ ...params, ...p })),
            }}
        >
            {props.children}
        </GenerationContext.Provider>
    );
};

export const useGenerationContext = () => useContext(GenerationContext);
