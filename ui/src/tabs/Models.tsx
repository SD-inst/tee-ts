import {
    Box,
    Grid,
    List,
    ListItem,
    ListItemText,
    Paper,
    TextField,
    Typography
} from '@mui/material';
import { red } from '@mui/material/colors';
import { useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { apiUrl } from '../config';
import { SamplePicker } from '../controls/SamplePicker';
import { useDebounce } from '../utils/debounce';

export const Models = () => {
    const [playing, setPlaying] = useState<{ model?: string; sample?: string }>(
        {}
    );
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
    return (
        <Paper elevation={5}>
            <Box sx={{ p: 2 }}>
                <Typography variant='h3'>Models list</Typography>
                <TextField
                    size='small'
                    placeholder='Filter'
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />
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
                                    />
                                </Grid>
                            </ListItem>
                        ))}
                    </List>
                )}
                {isError && (
                    <Typography color={red[800]}>
                        Error: {error.message}
                    </Typography>
                )}
            </Box>
            <audio ref={audioRef} onEnded={() => setPlaying({})} />
        </Paper>
    );
};
