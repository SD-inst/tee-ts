import { Send } from '@mui/icons-material';
import {
    Box,
    Button,
    CircularProgress,
    Grid,
    Paper,
    Typography,
} from '@mui/material';
import { red } from '@mui/material/colors';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { apiUrl } from '../config';
import { FileUpload } from '../controls/FileUpload';
import { Title } from '../controls/Title';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../reducers/store';
import { setFile, setResult } from '../reducers/rvc';

export const RVC = () => {
    const [error, setError] = useState('');
    const model = useSelector((state: RootState) => state.model.name);
    const { file, result } = useSelector((state: RootState) => state.rvc);
    const dispatch = useDispatch();
    const { mutate, isPending } = useMutation({
        mutationFn: () => {
            if (!model || !file) {
                return Promise.reject();
            }
            const f = new FormData();
            f.append('file', file);
            f.append('model', model);
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
            dispatch(setResult(blobURL));
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
            <Title sampleRequired={false} />
            <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12}>
                    <FileUpload
                        onChange={(f) => dispatch(setFile(f))}
                        fileSelected={file?.name}
                    />
                </Grid>
                <Grid item xs={12}>
                    <Button
                        variant='contained'
                        color='success'
                        startIcon={<Send />}
                        onClick={handleProcess}
                        disabled={!file || !model}
                    >
                        Process
                    </Button>
                </Grid>
                <Grid item xs={12}>
                    {result && <audio src={result} controls />}
                    {isPending && <CircularProgress />}
                    {error && <Typography color={red[900]}>{error}</Typography>}
                </Grid>
            </Grid>
        </Paper>
    );
};
