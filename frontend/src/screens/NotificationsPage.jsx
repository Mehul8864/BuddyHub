import {
    Avatar,
    Box,
    Button,
    Flex,
    Spinner,
    Text,
    useColorModeValue,
    IconButton,
    Badge,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useRecoilState } from "recoil";
import { notificationsAtom, unreadCountAtom } from "../atoms/notificationsAtom";
import useShowToast from "../hooks/useShowToast";
import { formatDistanceToNow } from "date-fns";
import { DeleteIcon } from "@chakra-ui/icons";
import { Link } from "react-router-dom";

const typeIcon = { like: "❤️", reply: "💬", follow: "👤", message: "✉️" };

const NotificationItem = ({ n, onDelete }) => {
    const readBg = useColorModeValue("white", "gray.dark");
    const unreadBg = useColorModeValue("blue.50", "blue.900");
    const hoverBg = useColorModeValue("gray.50", "gray.700");

    return (
        <Flex
            bg={n.read ? readBg : unreadBg}
            p={3}
            borderRadius="md"
            align="center"
            gap={3}
            _hover={{ bg: hoverBg, cursor: "pointer" }}
            borderLeft={n.read ? "none" : "3px solid"}
            borderLeftColor="blue.400"
        >
            <Text fontSize="xl">{typeIcon[n.type] || "🔔"}</Text>
            <Link to={`/${n.sender?.username}`} style={{ textDecoration: "none" }}>
                <Avatar src={n.sender?.profilePic} size="sm" name={n.sender?.username} />
            </Link>
            <Box flex={1}>
                <Text fontSize="sm">{n.message}</Text>
                <Text fontSize="xs" color="gray.500">
                    {n.createdAt ? formatDistanceToNow(new Date(n.createdAt)) + " ago" : ""}
                </Text>
            </Box>
            {n.post && (
                <Link to={`/${n.sender?.username}/post/${n.post._id}`} style={{ textDecoration: "none" }}>
                    <Text fontSize="xs" color="blue.400" noOfLines={1} maxW="80px">
                        {n.post.text || "📷"}
                    </Text>
                </Link>
            )}
            <IconButton
                icon={<DeleteIcon />}
                size="xs"
                variant="ghost"
                aria-label="Delete notification"
                onClick={() => onDelete(n._id)}
            />
        </Flex>
    );
};

const NotificationsPage = () => {
    const [notifications, setNotifications] = useRecoilState(notificationsAtom);
    const [, setUnreadCount] = useRecoilState(unreadCountAtom);
    const [loading, setLoading] = useState(true);
    const showToast = useShowToast();

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const res = await fetch("/api/notifications");
                const data = await res.json();
                if (data.error) { showToast("Error", data.error, "error"); return; }
                setNotifications(data);
            } catch (err) {
                showToast("Error", err.message, "error");
            } finally {
                setLoading(false);
            }
        };
        fetchNotifications();
    }, [showToast, setNotifications]);

    const markAllRead = async () => {
        try {
            await fetch("/api/notifications/mark-read", { method: "PUT" });
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (err) {
            showToast("Error", err.message, "error");
        }
    };

    const deleteNotification = async (id) => {
        try {
            await fetch(`/api/notifications/${id}`, { method: "DELETE" });
            setNotifications((prev) => prev.filter((n) => n._id !== id));
        } catch (err) {
            showToast("Error", err.message, "error");
        }
    };

    const unread = notifications.filter((n) => !n.read).length;

    if (loading) return <Flex justify="center" py={10}><Spinner size="xl" /></Flex>;

    return (
        <Box maxW="600px" mx="auto" py={4}>
            <Flex justify="space-between" align="center" mb={4}>
                <Flex align="center" gap={2}>
                    <Text fontSize="xl" fontWeight="bold">Notifications</Text>
                    {unread > 0 && (
                        <Badge colorScheme="red" borderRadius="full">{unread}</Badge>
                    )}
                </Flex>
                {unread > 0 && (
                    <Button size="sm" variant="ghost" onClick={markAllRead}>
                        Mark all read
                    </Button>
                )}
            </Flex>

            {notifications.length === 0 && (
                <Flex justify="center" py={10} direction="column" align="center" gap={2}>
                    <Text fontSize="3xl">🔔</Text>
                    <Text color="gray.500">No notifications yet</Text>
                </Flex>
            )}

            <Flex direction="column" gap={2}>
                {notifications.map((n) => (
                    <NotificationItem key={n._id} n={n} onDelete={deleteNotification} />
                ))}
            </Flex>
        </Box>
    );
};

export default NotificationsPage;
