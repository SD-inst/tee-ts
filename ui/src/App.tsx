import {
    Box,
    Tab,
    Tabs,
    ThemeProvider,
    createTheme,
    useMediaQuery,
} from '@mui/material';
import { Navigate, Route, Routes, useMatch, useNavigate } from 'react-router';
import './App.css';
import { Generate } from './tabs/Generate';
import { Models } from './tabs/Models';
import { GenerationContextProvider } from './contexts/GenerationContext';
import { RVC } from './tabs/RVC';

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
        <ThemeProvider theme={theme}>
            <Box sx={{ width: '100%' }}>
                <GenerationContextProvider>
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
                </GenerationContextProvider>
            </Box>
        </ThemeProvider>
    );
}

export default App;
