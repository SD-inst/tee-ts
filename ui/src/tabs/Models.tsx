import { Upload } from '@mui/icons-material';
import {
    Box,
    Button,
    Grid,
    List,
    ListItem,
    ListItemText,
    Paper,
    TextField,
    Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { apiUrl } from '../config';
import { SamplePicker } from '../controls/SamplePicker';
import { useDebounce } from '../utils/debounce';
import { showError } from '../utils/notify';
import { UploadDialog } from './Upload';

export const Models = () => {
    const [playing, setPlaying] = useState<{ model?: string; sample?: string }>(
        {}
    );
    const [editModelName, setEditModelName] = useState('');
    const [uploadOpen, setUploadOpen] = useState(false);
    const [filter, setFilter] = useState('');
    const dFilter = useDebounce(filter, 1000);
    const audioRef = useRef<HTMLAudioElement>(null);
    const { data, error, isSuccess, isError } = useQuery({
        queryKey: ['list_models', dFilter],
        queryFn: async () => {
            const r = await fetch(
                apiUrl +
                    '/models' +
                    (dFilter ? '?filter=' + encodeURIComponent(dFilter) : '')
            );
            const j = await r.json();
            return j;
        },
    });
    useEffect(() => {
        if (isError) {
            showError(error.message);
        }
    }, [isError, error]);
    const handlePlay = (model: string, sample: string) => {
        if (!audioRef.current) {
            return;
        }
        if (model === '' || sample === '') {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setPlaying({});
            return;
        }
        audioRef.current.src = `${apiUrl}/play_sample?model=${encodeURIComponent(
            model
        )}&sample=${encodeURIComponent(sample)}`;
        setPlaying({ model, sample });
        audioRef.current.play();
    };
    const handleUpload = () => {
        setEditModelName('');
        setUploadOpen(true);
    };
    return (
        <Paper elevation={5}>
            <Box sx={{ p: 2 }}>
                <Typography variant='h4'>Models list</Typography>
                <TextField
                    size='small'
                    placeholder='Filter'
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />
                <Box sx={{ mt: 1 }}>
                    <Button
                        startIcon={<Upload />}
                        variant='contained'
                        color='success'
                        onClick={handleUpload}
                    >
                        Upload model
                    </Button>
                </Box>
                {isSuccess && (
                    <List>
                        {data.map((m: any) => (
                            <ListItem key={m.name}>
                                <Grid
                                    container
                                    spacing={2}
                                    justifyContent='center'
                                >
                                    <Grid item>
                                        <ListItemText
                                            primaryTypographyProps={{
                                                variant: 'h5',
                                            }}
                                        >
                                            {m.name}
                                        </ListItemText>
                                    </Grid>
                                    <SamplePicker
                                        samples={m.samples}
                                        model={m.name}
                                        playing={playing}
                                        setPlaying={handlePlay}
                                        edit={(model) => {
                                            setEditModelName(model);
                                            setUploadOpen(true);
                                        }}
                                    />
                                </Grid>
                            </ListItem>
                        ))}
                    </List>
                )}
            </Box>
            <audio ref={audioRef} onEnded={() => setPlaying({})} />
            <UploadDialog
                open={uploadOpen}
                onClose={() => setUploadOpen(false)}
                modelName={editModelName}
                sampleNames={
                    data
                        ? (data as any[])
                              .filter((d: any) => d.name === editModelName)
                              .reduce((_, c) => c.samples, [])
                        : []
                }
            />
        </Paper>
    );
};
