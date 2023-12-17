import { Upload } from '@mui/icons-material';
import { Button, Container, Typography } from '@mui/material';

export const FileUpload = ({
    onChange,
    fileSelected,
}: {
    onChange: (e: File) => void;
    fileSelected?: string;
}) => {
    return (
        <Container sx={{ gap: 2 }}>
            <Button
                component='label'
                variant='contained'
                startIcon={<Upload />}
            >
                Upload file
                <input
                    type='file'
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
        </Container>
    );
};
