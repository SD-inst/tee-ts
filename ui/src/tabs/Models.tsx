import { People } from '@mui/icons-material';
import {
    Box,
    List,
    ListItem,
    ListItemAvatar,
    ListItemButton,
    ListItemText,
    Paper,
    Typography,
} from '@mui/material';

export const Models = () => {
    return (
        <Paper elevation={5}>
            <Box sx={{ p: 2 }}>
                <Typography variant='h3'>Models list</Typography>
                <List>
                    <ListItem>
                        <ListItemButton>
                            <ListItemAvatar>
                                <People />
                            </ListItemAvatar>
                            <ListItemText>Trump</ListItemText>
                        </ListItemButton>
                    </ListItem>
                </List>
            </Box>
        </Paper>
    );
};
