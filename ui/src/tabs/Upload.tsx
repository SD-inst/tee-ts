import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogProps,
    DialogTitle,
    LinearProgress,
    TextField,
    Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { apiUrl } from '../config';
import { FileUpload } from '../controls/FileUpload';
import { showError, showSuccess } from '../utils/notify';

export const UploadDialog = ({
    modelName,
    sampleNames,
    ...props
}: { modelName: string; sampleNames: string[] } & DialogProps) => {
    const [name, setName] = useState('');
    const [samples, setSamples] = useState<string[]>([]);
    const [pthFile, setPthFile] = useState<File>();
    const [indexFile, setIndexFile] = useState<File>();
    const [sampleFile, setSampleFile] = useState<File>();
    const [progress, setProgress] = useState(0);
    const qc = useQueryClient();
    const { mutateAsync } = useMutation({
        mutationKey: ['model_upload'],
        mutationFn: ({
            name,
            pthFile,
            indexFile,
            sampleFile,
        }: {
            name: string;
            pthFile?: File;
            indexFile?: File;
            sampleFile?: File;
        }) => {
            return new Promise((resolve, reject) => {
                const data = new FormData();
                data.append('name', name);
                sampleFile && data.append('sample', sampleFile);
                if (!modelName) {
                    pthFile && data.append('model', pthFile);
                    indexFile && data.append('index', indexFile);
                }
                const req = new XMLHttpRequest();
                req.upload.addEventListener('progress', function (ev) {
                    if (ev.total > 0) {
                        const perc = (ev.loaded * 100) / ev.total;
                        setProgress(perc);
                    }
                });
                req.addEventListener('readystatechange', () => {
                    if (req.readyState === XMLHttpRequest.DONE) {
                        if (req.status !== 200 && req.status !== 0) {
                            reject(JSON.parse(req.response));
                        } else {
                            resolve(null);
                            qc.invalidateQueries();
                        }
                        setProgress(0);
                    }
                });
                req.open('POST', apiUrl + '/upload');
                req.send(data);
            });
        },
    });

    useEffect(() => {
        setName(modelName);
        setSamples(sampleNames);
        setPthFile(undefined);
        setIndexFile(undefined);
        setSampleFile(undefined);
        setProgress(0);
    }, [props.open, modelName, sampleNames]);

    const handleUpload = async () => {
        setProgress(0.1);
        try {
            await mutateAsync({ name, pthFile, indexFile, sampleFile });
            props.onClose && props.onClose({}, 'escapeKeyDown');
            showSuccess('Model uploaded!');
        } catch (e: any) {
            showError('Error: ' + e.error);
        }
    };
    return (
        <Dialog
            {...props}
            onClose={(e, r) =>
                r !== 'backdropClick' && props.onClose && props.onClose(e, r)
            }
        >
            <DialogTitle>{name}</DialogTitle>
            <DialogContent>
                <Box
                    sx={{
                        display: 'flex',
                        gap: 1,
                        flexDirection: 'column',
                        mt: 1,
                    }}
                >
                    {!modelName && (
                        <>
                            <TextField
                                label='New model name'
                                value={name}
                                size='small'
                                onChange={(e) => setName(e.target.value)}
                            />
                            <FileUpload
                                onChange={(f) => setPthFile(f)}
                                fileSelected={pthFile?.name}
                                label='Choose .pth'
                                accept='.pth'
                            />
                            <FileUpload
                                onChange={(f) => setIndexFile(f)}
                                fileSelected={indexFile?.name}
                                label='Choose .index'
                                accept='.index'
                            />
                        </>
                    )}
                    {samples && (
                        <>
                            <Typography variant='h6'>Samples</Typography>
                            {!modelName && (
                                <Typography variant='subtitle2'>
                                    Can be added later
                                </Typography>
                            )}
                            {samples?.map((s) => (
                                <Box
                                    sx={{
                                        display: 'flex',
                                        flexDirection: {
                                            xs: 'column',
                                            sm: 'row',
                                        },
                                        alignItems: 'center',
                                    }}
                                >
                                    <Typography variant='body1'>{s}</Typography>
                                    <audio
                                        src={`${apiUrl}/play_sample?model=${encodeURIComponent(
                                            modelName
                                        )}&sample=${encodeURIComponent(s)}`}
                                        controls
                                    />
                                </Box>
                            ))}
                        </>
                    )}
                    <FileUpload
                        onChange={(f) => setSampleFile(f)}
                        fileSelected={sampleFile?.name}
                        label='Choose sample'
                    />
                    <Button
                        variant='contained'
                        color='success'
                        disabled={progress > 0 || !name}
                        onClick={handleUpload}
                    >
                        Upload
                    </Button>
                    {progress > 0 && (
                        <LinearProgress
                            variant='determinate'
                            value={progress}
                        />
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={() =>
                        props.onClose && props.onClose({}, 'backdropClick')
                    }
                >
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};
