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
    Slider,
    TextField,
    Typography,
} from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { apiUrl } from '../config';
import { useGenerationContext } from '../contexts/GenerationContext';
import { Link } from 'react-router-dom';

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

const Title = () => {
    const { genParams } = useGenerationContext();
    if (!genParams.model || !genParams.sample) {
        return (
            <Typography variant='h5'>
                Select the model and sample at the{' '}
                <Link to={'/models'}>models tab</Link>
            </Typography>
        );
    }
    return (
        <Typography variant='h5'>
            Model: {genParams.model}, sample: {genParams.sample}
        </Typography>
    );
};

export const Generate = () => {
    const { genParams, setGenParams } = useGenerationContext();
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
                    model: genParams.model,
                    sample: genParams.sample,
                    language: genParams.language,
                }),
            });
        },
        onSuccess: async (data) => {
            const blobURL = URL.createObjectURL(await data.blob());
            setGenParams({
                audios: genParams.audios?.concat([blobURL]),
            });
        },
    });
    const handleGenerate = async () => {
        setGenParams({ audios: [] });
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
                            margin='dense'
                            size='small'
                            value={genParams.text}
                            onChange={(e) =>
                                setGenParams({ text: e.target.value })
                            }
                            fullWidth
                            multiline
                        />
                    </Grid>
                    <Grid item>
                        <FormControl>
                            <InputLabel>Language</InputLabel>
                            <Select
                                label='language'
                                size='small'
                                margin='dense'
                                value={genParams.language}
                                onChange={(e) =>
                                    setGenParams({
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
                            disabled={!genParams.model || !genParams.sample}
                        >
                            <Send />
                        </Button>
                    </Grid>
                </Grid>
                <Grid container sx={{ mt: 2 }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                onChange={(e) =>
                                    setGenParams({ RVC: e.target.checked })
                                }
                                checked={genParams.RVC}
                            />
                        }
                        label='Use RVC'
                    />
                    <Box
                        sx={{
                            display: 'flex',
                            width: '50%',
                        }}
                    >
                        <TextField
                            type='number'
                            inputProps={{ min: 1, max: 10 }}
                            size='small'
                            sx={{ mr: 1, width: 100 }}
                            value={genParams.batch_size}
                            onChange={(e) =>
                                setGenParams({
                                    batch_size: Math.max(
                                        0,
                                        Math.min(10, parseInt(e.target.value))
                                    ),
                                })
                            }
                            label='Batch'
                        />
                        <Slider
                            value={genParams.batch_size}
                            min={1}
                            max={10}
                            onChange={(_, v) =>
                                setGenParams({ batch_size: v as number })
                            }
                        />
                    </Box>
                </Grid>
                <Grid container sx={{ mt: 2 }}>
                    {genParams.audios?.map((src) => (
                        <audio src={src} controls key={src} />
                    ))}
                    {isPending && <CircularProgress />}
                </Grid>
            </Box>
        </Paper>
    );
};
