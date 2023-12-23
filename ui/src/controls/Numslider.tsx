import { Box, TextField, Slider, TextFieldProps } from '@mui/material';

export const NumSlider = ({
    min,
    max,
    value,
    step = 1,
    width,
    setValue,
    ...props
}: {
    min: number;
    max: number;
    value: number;
    step?: number;
    width?: string;
    setValue: (v: number) => void;
} & TextFieldProps) => {
    const setClampedValue = (v: any) =>
        setValue(Math.max(min, Math.min(max, parseFloat(v))));
    return (
        <Box
            sx={{
                display: 'flex',
                width: width,
                gap: 1,
                alignItems: 'center',
            }}
        >
            <TextField
                type='number'
                inputProps={{ min, max }}
                size='small'
                value={value}
                onChange={(e) => setClampedValue(e.target.value)}
                sx={{
                    width: { xs: '10rem', sm: '7rem' },
                }}
                {...props}
            />
            <Slider
                value={value}
                min={min}
                max={max}
                step={step}
                onChange={(_, v) => setClampedValue(v)}
            />
        </Box>
    );
};
