import {
    Box,
    Tab,
    Tabs,
    ThemeProvider,
    createTheme,
    useMediaQuery,
} from '@mui/material';
import { Provider } from 'react-redux';
import { Navigate, Route, Routes, useMatch, useNavigate } from 'react-router';
import './App.css';
import { store } from './reducers/store';
import { Generate } from './tabs/Generate';
import { Models } from './tabs/Models';
import { RVC } from './tabs/RVC';
import { SnackbarProvider } from 'notistack';

function App() {
    const nav = useNavigate();
    const match = useMatch('/:tab');
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    const theme = createTheme({
        palette: {
            mode: prefersDarkMode ? 'dark' : 'light',
        },
    });
    return (
        <Provider store={store}>
            <ThemeProvider theme={theme}>
                <SnackbarProvider />
                <Box sx={{ width: '100%' }}>
                    <Tabs
                        value={match?.params.tab}
                        onChange={(_, v) => nav(v)}
                        sx={{ mb: 1 }}
                    >
                        <Tab label='Generation' value='gen' />
                        <Tab label='Models' value='models' />
                        <Tab label='RVC' value='rvc' />
                    </Tabs>
                    <Routes>
                        <Route
                            path='/'
                            element={<Navigate to='gen' replace />}
                        />
                        <Route path='gen' element={<Generate />} />
                        <Route path='models' element={<Models />} />
                        <Route path='rvc' element={<RVC />} />
                    </Routes>
                </Box>
            </ThemeProvider>
        </Provider>
    );
}

export default App;
