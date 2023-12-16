import { Send } from '@mui/icons-material';
import {
    Box,
    Button,
    Checkbox,
    CircularProgress,
    FormControlLabel,
    Paper,
    TextField,
    Typography,
} from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { apiUrl } from '../config';
import { useGenerationContext } from '../contexts/GenerationContext';

export const Generate = () => {
    const {
        text,
        setText,
        RVC,
        setRVC,
        samples,
        setSamples,
        audios,
        setAudios,
    } = useGenerationContext();
    const { mutateAsync, isPending } = useMutation({
        mutationFn: () => {
            const headers = new Headers();
            headers.set('Content-Type', 'application/json');
            return fetch(apiUrl + '/generate', {
                method: 'POST',
                headers,
                body: JSON.stringify({ text, rvc: RVC }),
            });
        },
        onSuccess: async (data) => {
            const blobURL = URL.createObjectURL(await data.blob());
            setAudios((a) => a.concat([blobURL]));
        },
    });
    const handleGenerate = async () => {
        setAudios([]);
        for (let i = 0; i < samples; i++) {
            await mutateAsync();
        }
    };
    return (
        <Paper elevation={5}>
            <Box
                sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                }}
            >
                <Typography variant='h3' sx={{ alignSelf: 'center' }}>
                    Generate speech
                </Typography>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        width: '100%',
                    }}
                >
                    <TextField
                        placeholder='Text'
                        margin='dense'
                        size='small'
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        fullWidth
                        multiline
                    />
                    <Button onClick={handleGenerate} size='small'>
                        <Send />
                    </Button>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, p: 1 }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                onChange={(e) => setRVC(e.target.checked)}
                                checked={RVC}
                            />
                        }
                        label='Use RVC'
                    />
                    <FormControlLabel
                        control={
                            <TextField
                                type='number'
                                inputProps={{ min: 1, max: 10 }}
                                size='small'
                                sx={{ mr: 1 }}
                                value={samples}
                                onChange={(e) =>
                                    setSamples(
                                        Math.max(
                                            0,
                                            Math.min(
                                                10,
                                                parseInt(e.target.value)
                                            )
                                        )
                                    )
                                }
                            />
                        }
                        label='Number of samples'
                    />
                </Box>
                <Box
                    sx={{
                        display: 'flex',
                        gap: 2,
                        alignItems: 'center',
                        flexWrap: 'wrap',
                    }}
                >
                    {audios.map((src) => (
                        <audio src={src} controls />
                    ))}
                    {isPending && <CircularProgress />}
                </Box>
            </Box>
        </Paper>
    );
};
