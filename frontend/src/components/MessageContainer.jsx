import {
    Avatar,
    Divider,
    Flex,
    Image,
    Skeleton,
    SkeletonCircle,
    Text,
    useColorModeValue,
    Box,
} from "@chakra-ui/react";
import Message from "./Message";
import MessageInput from "./MessageInput";
import { useEffect, useRef, useState } from "react";
import useShowToast from "../hooks/useShowToast";
import { conversationsAtom, selectedConversationAtom } from "../atoms/messagesAtom";
import { useRecoilValue, useSetRecoilState } from "recoil";
import userAtom from "../atoms/userAtom";
import { useSocket } from "../context/SocketContext.jsx";

const MessageContainer = () => {
    const showToast = useShowToast();
    const selectedConversation = useRecoilValue(selectedConversationAtom);
    const [loadingMessages, setLoadingMessages] = useState(true);
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const currentUser = useRecoilValue(userAtom);
    const { socket } = useSocket();
    const setConversations = useSetRecoilState(conversationsAtom);
    const messageEndRef = useRef(null);
    const selectedConvRef = useRef(selectedConversation);
    const currentUserRef = useRef(currentUser);
    const audioRef = useRef(null);

    useEffect(() => { selectedConvRef.current = selectedConversation; }, [selectedConversation]);
    useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

    useEffect(() => {
        try { audioRef.current = new Audio("/sounds/message.mp3"); } catch { audioRef.current = null; }
    }, []);

    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (message) => {
            setConversations((prev) =>
                prev.map((c) =>
                    c._id === message.conversationId
                        ? { ...c, lastMessage: { text: message.text, sender: message.sender } }
                        : c
                )
            );
            if (selectedConvRef.current?._id === message.conversationId) {
                setMessages((prev) => [...prev, message]);
            }
            if (!document.hasFocus() && audioRef.current) audioRef.current.play().catch(() => {});
        };

        const handleMessageDeleted = ({ messageId }) => {
            setMessages((prev) => prev.filter((m) => m._id !== messageId));
        };

        const handleTyping = ({ conversationId }) => {
            if (selectedConvRef.current?._id === conversationId) setIsTyping(true);
        };

        const handleStopTyping = ({ conversationId }) => {
            if (selectedConvRef.current?._id === conversationId) setIsTyping(false);
        };

        const handleMessagesSeen = ({ conversationId }) => {
            if (selectedConvRef.current?._id === conversationId) {
                setMessages((prev) => prev.map((msg) => (msg.seen ? msg : { ...msg, seen: true })));
            }
        };

        socket.on("newMessage", handleNewMessage);
        socket.on("messageDeleted", handleMessageDeleted);
        socket.on("typing", handleTyping);
        socket.on("stopTyping", handleStopTyping);
        socket.on("messagesSeen", handleMessagesSeen);

        return () => {
            socket.off("newMessage", handleNewMessage);
            socket.off("messageDeleted", handleMessageDeleted);
            socket.off("typing", handleTyping);
            socket.off("stopTyping", handleStopTyping);
            socket.off("messagesSeen", handleMessagesSeen);
        };
    }, [socket, setConversations]);

    useEffect(() => {
        if (!socket || !selectedConversation?._id || !messages?.length) return;
        const last = messages[messages.length - 1];
        if (last && last.sender !== currentUserRef.current?._id && !last.seen) {
            socket.emit("markMessagesAsSeen", {
                conversationId: selectedConversation._id,
                userId: selectedConversation.userId,
            });
        }
    }, [messages, selectedConversation?._id, socket]);

    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    useEffect(() => {
        const getMessages = async () => {
            setLoadingMessages(true);
            setMessages([]);
            try {
                if (!selectedConversation || selectedConversation.mock) return;
                const res = await fetch(`/api/messages/${selectedConversation.userId}`);
                const data = await res.json();
                if (data?.error) { showToast("Error", data.error, "error"); return; }
                setMessages(Array.isArray(data) ? data : []);
            } catch (error) {
                showToast("Error", error?.message || "Failed to fetch messages", "error");
            } finally {
                setLoadingMessages(false);
            }
        };
        getMessages();
    }, [showToast, selectedConversation?.userId, selectedConversation?.mock]);

    const handleDeleteMessage = async (messageId) => {
        try {
            const res = await fetch(`/api/messages/${messageId}`, { method: "DELETE" });
            const data = await res.json();
            if (data.error) { showToast("Error", data.error, "error"); return; }
            setMessages((prev) => prev.filter((m) => m._id !== messageId));
        } catch (err) {
            showToast("Error", err.message, "error");
        }
    };

    return (
        <Flex
            flex="70"
            bg={useColorModeValue("gray.200", "gray.dark")}
            borderRadius={"md"}
            p={2}
            flexDirection={"column"}
        >
            <Flex w={"full"} h={12} alignItems={"center"} gap={2}>
                <Avatar src={selectedConversation?.userProfilePic} size={"sm"} />
                <Text display={"flex"} alignItems={"center"}>
                    {selectedConversation?.username}{" "}
                    <Image src="/verified.png" w={4} h={4} ml={1} />
                </Text>
            </Flex>

            <Divider />

            <Flex flexDir={"column"} gap={4} my={4} p={2} height={"400px"} overflowY={"auto"}>
                {loadingMessages &&
                    [...Array(5)].map((_, i) => (
                        <Flex key={i} gap={2} alignItems={"center"} p={1} borderRadius={"md"} alignSelf={i % 2 === 0 ? "flex-start" : "flex-end"}>
                            {i % 2 === 0 && <SkeletonCircle size={7} />}
                            <Flex flexDir={"column"} gap={2}>
                                <Skeleton h="8px" w="250px" />
                                <Skeleton h="8px" w="250px" />
                            </Flex>
                            {i % 2 !== 0 && <SkeletonCircle size={7} />}
                        </Flex>
                    ))}

                {!loadingMessages &&
                    messages.map((message, idx) => (
                        <Flex
                            key={message._id || idx}
                            direction={"column"}
                            ref={idx === messages.length - 1 ? messageEndRef : null}
                        >
                            <Message
                                message={message}
                                ownMessage={currentUser?._id === message.sender}
                                onDelete={handleDeleteMessage}
                            />
                        </Flex>
                    ))}

                {isTyping && (
                    <Flex align="center" gap={2} ref={messageEndRef}>
                        <Avatar src={selectedConversation?.userProfilePic} size="xs" />
                        <Box bg={useColorModeValue("gray.300", "gray.600")} px={3} py={2} borderRadius="xl">
                            <Flex gap={1} align="center">
                                <Box w={2} h={2} bg="gray.500" borderRadius="full" animation="bounce 1s infinite" />
                                <Box w={2} h={2} bg="gray.500" borderRadius="full" animation="bounce 1s infinite 0.2s" />
                                <Box w={2} h={2} bg="gray.500" borderRadius="full" animation="bounce 1s infinite 0.4s" />
                            </Flex>
                        </Box>
                    </Flex>
                )}
            </Flex>

            <MessageInput setMessages={setMessages} />
        </Flex>
    );
};

export default MessageContainer;
