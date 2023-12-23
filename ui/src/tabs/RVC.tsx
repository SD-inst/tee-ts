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
import { useDispatch, useSelector } from 'react-redux';
import { apiUrl } from '../config';
import { FileUpload } from '../controls/FileUpload';
import { RVCParams } from '../controls/RVCParams';
import { Title } from '../controls/Title';
import { setFile, setResult } from '../reducers/rvc';
import { RootState } from '../reducers/store';
import { showError } from '../utils/notify';

export const RVC = () => {
    const model = useSelector((state: RootState) => state.model.name);
    const rvcParams = useSelector((state: RootState) => state.rvcparams);
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
            Object.entries(rvcParams).forEach(([k, v]) => f.append(k, '' + v));
            return fetch(apiUrl + '/rvc', {
                method: 'POST',
                body: f,
            });
        },
        onSuccess: async (data) => {
            if (data.status !== 200) {
                const j = await data.json();
                showError('Error processing audio: ' + j.error);
                return;
            }
            const blobURL = URL.createObjectURL(await data.blob());
            dispatch(setResult(blobURL));
        },
        onError: (e) => showError(e.message),
    });
    const handleProcess = () => {
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
                    <RVCParams />
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
                </Grid>
            </Grid>
        </Paper>
    );
};
