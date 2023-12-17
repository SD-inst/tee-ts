import { Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { useGenerationContext } from '../contexts/GenerationContext';

export const Title = ({ sampleRequired = true, ...props }) => {
    const { genParams } = useGenerationContext();
    if (!genParams.model || (!genParams.sample && sampleRequired)) {
        return (
            <Typography variant='h5' {...props}>
                Select the model and sample at the{' '}
                <Link to={'/models'}>models tab</Link>
            </Typography>
        );
    }
    return (
        <Typography variant='h5' {...props}>
            Model: {genParams.model}
            {genParams.sample ? `sample: ${genParams.sample}` : ''}
        </Typography>
    );
};
