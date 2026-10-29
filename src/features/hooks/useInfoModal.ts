// Authored by - Sarthak Kumar
//
// useInfoModal: open state for the info dialog, shared by the toolbar's button and ui/InfoModal.
// - Opens on a first visit; closing the dialog (Esc, X, backdrop) marks it seen in localStorage
// - Storage is read once (lazy useState initializer): GridPage, which owns this, re-renders every frame
//   during a run

import React from 'react';

const INFO_SEEN_KEY = 'algoviz:info-seen';
const INFO_SEEN = 'seen';

// blocked storage (Safari private mode): the dialog just opens again next time.
const getKey = (key: string) => {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        console.error('error getting key from localStorage', e);
    }
};

const setKey = (key: string, val: string) => {
    try {
        localStorage.setItem(key, val);
    } catch (e) {
        console.error('error setting key in localStorage', e);
    }
};

export const useInfoModal = () => {
    const [open, setOpen] = React.useState(() => getKey(INFO_SEEN_KEY) !== INFO_SEEN);

    const toggleModal = React.useCallback(() => {
        setOpen((prev) => !prev);
    }, []);

    const onModalClosed = React.useCallback(() => {
        setKey(INFO_SEEN_KEY, INFO_SEEN);
        setOpen(false);
    }, []);

    return {
        modalOpen: open,
        toggleModal,
        onModalClosed,
    };
};
