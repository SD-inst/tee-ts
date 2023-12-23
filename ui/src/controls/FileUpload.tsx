import { Upload } from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';

export const FileUpload = ({
    onChange,
    fileSelected,
    label = 'Upload file',
    accept,
}: {
    onChange: (e: File) => void;
    fileSelected?: string;
    label?: string;
    accept?: string;
}) => {
    return (
        <Box>
            <Button
                component='label'
                variant='contained'
                startIcon={<Upload />}
            >
                {label}
                <input
                    type='file'
                    accept={accept}
                    style={{ display: 'none' }}
                    onChange={(e) =>
                        e.target.files && onChange(e.target.files[0])
                    }
                />
            </Button>
            {fileSelected && (
                <Typography variant='body1' sx={{ mt: 1 }}>
                    {fileSelected}
                </Typography>
            )}
        </Box>
    );
};
