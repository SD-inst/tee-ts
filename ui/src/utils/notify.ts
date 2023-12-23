import { enqueueSnackbar } from 'notistack';

export const showError = (message: string) =>
    enqueueSnackbar({
        variant: 'error',
        message,
    });

export const showSuccess = (message: string) =>
    enqueueSnackbar({
        variant: 'success',
        message,
    });
