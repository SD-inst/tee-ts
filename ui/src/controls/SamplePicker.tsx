import { CheckCircle, PlayArrow, Stop } from '@mui/icons-material';
import {
    Button,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    Tooltip,
    Typography,
} from '@mui/material';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';
import { setModel, setSample } from '../reducers/model';

export const SamplePicker = ({
    samples,
    model,
    playing,
    setPlaying,
}: {
    samples: string[];
    model: string;
    playing: { model?: string; sample?: string };
    setPlaying: (model: string, sample: string) => void;
}) => {
    const [selected, setSelected] = useState(samples.length ? samples[0] : '');
    const dispatch = useDispatch();
    const handlePlay = () => {
        if (playing.model === model && playing.sample === selected) {
            setPlaying('', '');
        } else {
            setPlaying(model, selected);
        }
    };
    const nav = useNavigate();
    const handleSelect = () => {
        dispatch(setModel(model));
        dispatch(setSample(selected));
        nav(-1);
    };
    return (
        <Grid
            item
            container
            spacing={2}
            alignItems='center'
            justifyContent='center'
        >
            <Grid item container sm={6} justifyContent={{ md: 'right' }}>
                {samples.length ? (
                    <FormControl sx={{ maxWidth: 300 }}>
                        <InputLabel id='sample_selection'>Samples</InputLabel>
                        <Select
                            value={selected}
                            onChange={(e) => setSelected(e.target.value)}
                            label='Samples'
                            labelId='sample_selection'
                            size='small'
                        >
                            {samples.map((s: string) => (
                                <MenuItem key={s} value={s}>
                                    {s}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                ) : (
                    <Typography variant='body2'>
                        No samples, can be used for RVC only
                    </Typography>
                )}
            </Grid>
            <Grid item container gap={2} sm={6}>
                {samples.length ? (
                    <Button
                        variant='outlined'
                        size='small'
                        onClick={handlePlay}
                    >
                        {playing.model === model &&
                        playing.sample === selected ? (
                            <Stop />
                        ) : (
                            <PlayArrow />
                        )}
                    </Button>
                ) : null}
                <Tooltip title='Select this model'>
                    <Button
                        variant='outlined'
                        size='small'
                        onClick={handleSelect}
                    >
                        <CheckCircle />
                    </Button>
                </Tooltip>
            </Grid>
        </Grid>
    );
};
