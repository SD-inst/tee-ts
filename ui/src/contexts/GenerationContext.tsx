import {
    Dispatch,
    SetStateAction,
    createContext,
    useContext,
    useState,
} from 'react';

type value = {
    text: string;
    setText: Dispatch<SetStateAction<string>>;
    RVC: boolean;
    setRVC: Dispatch<SetStateAction<boolean>>;
    audios: string[];
    setAudios: Dispatch<SetStateAction<string[]>>;
    samples: number;
    setSamples: Dispatch<SetStateAction<number>>;
};

const GenerationContext = createContext<value>({
    text: '',
    setText: () => {},
    RVC: true,
    setRVC: () => {},
    audios: [] as string[],
    setAudios: () => {},
    samples: 1,
    setSamples: () => {},
});

export const GenerationContextProvider = (props: any) => {
    const [text, setText] = useState('');
    const [RVC, setRVC] = useState(true);
    const [audios, setAudios] = useState<string[]>([]);
    const [samples, setSamples] = useState(1);
    return (
        <GenerationContext.Provider
            value={{
                text,
                setText,
                RVC,
                setRVC,
                audios,
                setAudios,
                samples,
                setSamples,
            }}
        >
            {props.children}
        </GenerationContext.Provider>
    );
};

export const useGenerationContext = () => useContext(GenerationContext);
