import { CheckCircle, PlayArrow, Stop } from '@mui/icons-material';
import {
    Box,
    Button,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Tooltip,
} from '@mui/material';
import { useState } from 'react';
import { useGenerationContext } from '../contexts/GenerationContext';
import { useNavigate } from 'react-router';

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
    const { setGenParams } = useGenerationContext();
    const [selected, setSelected] = useState(samples.length ? samples[0] : '');
    const handlePlay = () => {
        if (playing.model === model && playing.sample === selected) {
            setPlaying('', '');
        } else {
            setPlaying(model, selected);
        }
    };
    const nav = useNavigate();
    const handleSelect = () => {
        setGenParams({ model, sample: selected });
        nav('/gen');
    };
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FormControl sx={{ minWidth: 120 }}>
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
            <Button variant='outlined' size='small' onClick={handlePlay}>
                {playing.model === model && playing.sample === selected ? (
                    <Stop />
                ) : (
                    <PlayArrow />
                )}
            </Button>
            <Tooltip title='Select this model'>
                <Button variant='outlined' size='small' onClick={handleSelect}>
                    <CheckCircle />
                </Button>
            </Tooltip>
        </Box>
    );
};
