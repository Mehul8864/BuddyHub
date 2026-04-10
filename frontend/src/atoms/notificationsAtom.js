import { atom } from "recoil";

export const notificationsAtom = atom({
    key: "notificationsAtom",
    default: [],
});

export const unreadCountAtom = atom({
    key: "unreadCountAtom",
    default: 0,
});
