import { useEffect, useState, useContext, createContext } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import io from "socket.io-client";
import userAtom from "../atoms/userAtom";
import { notificationsAtom, unreadCountAtom } from "../atoms/notificationsAtom";

const SocketContext = createContext();
export const useSocket = () => useContext(SocketContext);

export const SocketContextProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const user = useRecoilValue(userAtom);
    const setNotifications = useSetRecoilState(notificationsAtom);
    const setUnreadCount = useSetRecoilState(unreadCountAtom);

    useEffect(() => {
        if (!user?._id) {
            if (socket) { socket.close(); setSocket(null); }
            return;
        }

        const newSocket = io("/", { query: { userId: user._id } });
        setSocket(newSocket);

        newSocket.on("getOnlineUsers", (users) => setOnlineUsers(users));

        newSocket.on("newNotification", (notification) => {
            setNotifications((prev) => [notification, ...prev]);
            setUnreadCount((prev) => prev + 1);
        });

        return () => newSocket.close();
    }, [user?._id]);

    return (
        <SocketContext.Provider value={{ socket, onlineUsers }}>
            {children}
        </SocketContext.Provider>
    );
};
