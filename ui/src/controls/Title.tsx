import { Typography } from '@mui/material';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { RootState } from '../reducers/store';

export const Title = ({ sampleRequired = true, ...props }) => {
    const { name, sample } = useSelector((state: RootState) => state.model);
    if (!name || (!sample && sampleRequired)) {
        return (
            <Typography variant='h5' {...props}>
                Select the model and sample at the{' '}
                <Link to={'/models'}>models tab</Link>
            </Typography>
        );
    }
    return (
        <Typography variant='h5' {...props}>
            Model: {name}
            {sample ? `, sample: ${sample}` : ''}
        </Typography>
    );
};
