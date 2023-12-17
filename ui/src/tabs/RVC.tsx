import { Send } from '@mui/icons-material';
import {
    Box,
    Button,
    CircularProgress,
    Grid,
    Paper,
    Typography,
} from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { apiUrl } from '../config';
import { useGenerationContext } from '../contexts/GenerationContext';
import { FileUpload } from '../controls/FileUpload';
import { Title } from '../controls/Title';
import { useState } from 'react';
import { red } from '@mui/material/colors';

export const RVC = () => {
    const [error, setError] = useState('');
    const { genParams, setGenParams } = useGenerationContext();
    const { mutate, isPending } = useMutation({
        mutationFn: () => {
            if (!genParams.model || !genParams.rvcFile) {
                return Promise.reject();
            }
            const f = new FormData();
            f.append('file', genParams.rvcFile);
            f.append('model', genParams.model);
            return fetch(apiUrl + '/rvc', {
                method: 'POST',
                body: f,
            });
        },
        onSuccess: async (data) => {
            if (data.status !== 200) {
                setError('Error processing audio.');
                return;
            }
            const blobURL = URL.createObjectURL(await data.blob());
            setGenParams({
                rvcAudio: blobURL,
            });
        },
        onError: (e) => setError(e.message),
    });
    const handleProcess = () => {
        setError('');
        mutate();
    };
    return (
        <Paper elevation={5} sx={{ p: 2 }}>
            <Box sx={{ p: 2 }}>
                <Typography variant='h4'>Voice changer</Typography>
            </Box>
            <Title />
            <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12}>
                    <FileUpload
                        onChange={(f) => setGenParams({ rvcFile: f })}
                        fileSelected={genParams.rvcFile?.name}
                    />
                </Grid>
                <Grid item xs={12}>
                    <Button
                        variant='contained'
                        color='success'
                        startIcon={<Send />}
                        onClick={handleProcess}
                        disabled={!genParams.rvcFile}
                    >
                        Process
                    </Button>
                </Grid>
                <Grid item xs={12}>
                    {genParams.rvcAudio && (
                        <audio src={genParams.rvcAudio} controls />
                    )}
                    {isPending && <CircularProgress />}
                    {error && <Typography color={red[900]}>{error}</Typography>}
                </Grid>
            </Grid>
        </Paper>
    );
};
