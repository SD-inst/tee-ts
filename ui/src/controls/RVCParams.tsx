import {
    Accordion,
    AccordionDetails,
    AccordionProps,
    AccordionSummary,
} from '@mui/material';
import { NumSlider } from './Numslider';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../reducers/store';
import { setParam } from '../reducers/rvcparams';
import { ExpandMore } from '@mui/icons-material';

export const RVCParams = ({ ...props }: Omit<AccordionProps, 'children'>) => {
    const params = useSelector((state: RootState) => state.rvcparams);
    const dispatch = useDispatch();
    return (
        <Accordion variant='elevation' {...props}>
            <AccordionSummary expandIcon={<ExpandMore />}>
                RVC parameters
            </AccordionSummary>
            <AccordionDetails
                sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
            >
                <NumSlider
                    min={-12}
                    max={12}
                    label='Pitch shift'
                    value={params.pitch}
                    setValue={(v) => dispatch(setParam({ pitch: v }))}
                />
                <NumSlider
                    min={0}
                    max={1}
                    step={0.01}
                    label='Index'
                    value={params.index}
                    setValue={(v) => dispatch(setParam({ index: v }))}
                />
                <NumSlider
                    min={0}
                    max={7}
                    step={1}
                    label='Filter radius'
                    value={params.filter_radius}
                    setValue={(v) => dispatch(setParam({ filter_radius: v }))}
                />
                <NumSlider
                    min={0}
                    max={1}
                    step={0.01}
                    label='RMX mix rate'
                    value={params.rms_mix_rate}
                    setValue={(v) => dispatch(setParam({ rms_mix_rate: v }))}
                />
                <NumSlider
                    min={0}
                    max={1}
                    step={0.01}
                    label='Protect'
                    value={params.protect}
                    setValue={(v) => dispatch(setParam({ protect: v }))}
                />
            </AccordionDetails>
        </Accordion>
    );
};
