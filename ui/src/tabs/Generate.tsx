import { Send } from '@mui/icons-material';
import {
    Box,
    Button,
    Checkbox,
    CircularProgress,
    FormControl,
    FormControlLabel,
    Grid,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    TextField,
    Typography
} from '@mui/material';
import { red } from '@mui/material/colors';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { apiUrl } from '../config';
import { NumSlider } from '../controls/Numslider';
import { RVCParams } from '../controls/RVCParams';
import { Title } from '../controls/Title';
import { appendAudio, clearAudio, useSetGenParam } from '../reducers/generate';
import { RootState } from '../reducers/store';

const languages = [
    ['en', 'English'],
    ['de', 'German'],
    ['es', 'Spanish'],
    ['ru', 'Russian'],
    ['pl', 'Polish'],
    ['fr', 'French'],
    ['it', 'Italian'],
    ['pt', 'Portuguese'],
    ['tr', 'Turkish'],
    ['nl', 'Dutch'],
    ['cs', 'Czech'],
    ['ar', 'Arabic'],
    ['zh-cn', 'Chinese'],
    ['ja', 'Japanese'],
    ['hu', 'Hungarian'],
    ['ko', 'Korean'],
    ['hi', 'Hindi'],
];

export const Generate = () => {
    const [error, setError] = useState('');
    const dispatch = useDispatch();
    const genParams = useSelector((state: RootState) => state.generate.params);
    const model = useSelector((state: RootState) => state.model);
    const audios = useSelector((state: RootState) => state.generate.audios);
    const rvcParams = useSelector((state: RootState) => state.rvcparams);
    const setGenParam = useSetGenParam();
    const { mutateAsync, isPending } = useMutation({
        mutationFn: () => {
            const headers = new Headers();
            headers.set('Content-Type', 'application/json');
            return fetch(apiUrl + '/generate', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    text: genParams.text,
                    rvc: genParams.RVC,
                    model: model.name,
                    sample: model.sample,
                    language: genParams.language,
                    ...rvcParams,
                }),
            });
        },
        onSuccess: async (data) => {
            if (data.status !== 200) {
                setError('Error generating audio.');
                return;
            }
            const blobURL = URL.createObjectURL(await data.blob());
            dispatch(appendAudio(blobURL));
        },
    });
    const handleGenerate = async () => {
        dispatch(clearAudio());
        setError('');
        for (let i = 0; i < (genParams.batch_size || 0); i++) {
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
                <Typography variant='h4' sx={{ alignSelf: 'center' }}>
                    Generate speech
                </Typography>
                <Title />
                <Grid container spacing={2} sx={{ mt: 2 }} alignItems='center'>
                    <Grid item xs={12} md={9}>
                        <TextField
                            placeholder='Text'
                            size='small'
                            value={genParams.text}
                            onChange={(e) =>
                                setGenParam({ text: e.target.value })
                            }
                            fullWidth
                            multiline
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Box display='flex' gap={1} alignItems='center'>
                            <FormControl>
                                <InputLabel>Language</InputLabel>
                                <Select
                                    label='language'
                                    size='small'
                                    margin='dense'
                                    value={genParams.language}
                                    onChange={(e) =>
                                        setGenParam({
                                            language: e.target.value,
                                        })
                                    }
                                >
                                    {languages.map(([code, name]) => (
                                        <MenuItem value={code} key={code}>
                                            {name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Button
                                onClick={handleGenerate}
                                size='small'
                                disabled={!model.name || !model.sample}
                            >
                                <Send />
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
                <Grid container sx={{ mt: 2 }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                onChange={(e) =>
                                    setGenParam({ RVC: e.target.checked })
                                }
                                checked={genParams.RVC}
                            />
                        }
                        label='Use RVC'
                    />
                    <NumSlider
                        min={1}
                        max={10}
                        width='50%'
                        sx={{ mr: 1, width: 100 }}
                        value={genParams.batch_size}
                        setValue={(v) => setGenParam({ batch_size: v })}
                        label='Batch'
                    />
                </Grid>
                <RVCParams sx={{ width: '100%', mt: 1 }} />
                <Grid container gap={1} sx={{ mt: 2 }}>
                    {audios.map((src: string) => (
                        <audio src={src} controls key={src} />
                    ))}
                    {isPending && <CircularProgress />}
                    {error && <Typography color={red[900]}>{error}</Typography>}
                </Grid>
            </Box>
        </Paper>
    );
};
