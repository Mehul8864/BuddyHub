import { SearchIcon } from "@chakra-ui/icons";
import {
    Box,
    Button,
    Flex,
    Input,
    Skeleton,
    SkeletonCircle,
    Text,
    useColorModeValue,
} from "@chakra-ui/react";
import Conversation from "../components/Conversation";
import { GiConversation } from "react-icons/gi";
import MessageContainer from "../components/MessageContainer";
import { useEffect, useState } from "react";
import useShowToast from "../hooks/useShowToast";
import { useRecoilState, useRecoilValue } from "recoil";
import {
    conversationsAtom,
    selectedConversationAtom,
} from "../atoms/messagesAtom";
import userAtom from "../atoms/userAtom";
import { useSocket } from "../context/SocketContext";

const ChatPage = () => {
    const [searchingUser, setSearchingUser] = useState(false);
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [searchText, setSearchText] = useState("");
    const [selectedConversation, setSelectedConversation] = useRecoilState(
        selectedConversationAtom
    );
    const [conversations, setConversations] = useRecoilState(conversationsAtom);
    const currentUser = useRecoilValue(userAtom);
    const showToast = useShowToast();
    const { socket, onlineUsers } = useSocket();

    useEffect(() => {
        if (!socket) return;
        const handleMessagesSeen = ({ conversationId }) => {
            setConversations((prev) =>
                prev.map((conversation) => {
                    if (conversation._id === conversationId) {
                        return {
                            ...conversation,
                            lastMessage: {
                                ...conversation.lastMessage,
                                seen: true,
                            },
                        };
                    }
                    return conversation;
                })
            );
        };

        socket.on("messagesSeen", handleMessagesSeen);
        return () => {
            socket.off("messagesSeen", handleMessagesSeen);
        };
    }, [socket, setConversations]);

    useEffect(() => {
        const getConversations = async () => {
            try {
                const res = await fetch("/api/messages/conversations");
                const data = await res.json();
                if (!res.ok || data.error) {
                    showToast("Error", data?.error || "Failed to load", "error");
                    return;
                }
                setConversations(data);
            } catch (error) {
                showToast("Error", error.message, "error");
            } finally {
                setLoadingConversations(false);
            }
        };

        getConversations();
    }, [showToast, setConversations]);

    const getOtherParticipant = (conversation) => {
        if (!conversation?.participants) return null;
        return (
            conversation.participants.find((p) => p._id !== currentUser._id) ||
            conversation.participants[0]
        );
    };

    const handleConversationSearch = async (e) => {
        e?.preventDefault();
        if (!searchText?.trim()) {
            showToast("Info", "Please enter a username or id to search", "info");
            return;
        }

        setSearchingUser(true);
        try {
            const encoded = encodeURIComponent(searchText.trim());
            const res = await fetch(`/api/users/profile/${encoded}`);
            const searchedUser = await res.json();

            if (!res.ok || searchedUser.error) {
                showToast("Error", searchedUser?.error || "User not found", "error");
                return;
            }

            if (searchedUser._id === currentUser._id) {
                showToast("Error", "You cannot message yourself", "error");
                return;
            }

            // find any conversation that includes searchedUser
            const conversationAlreadyExists = conversations.find((conversation) =>
                conversation.participants?.some((p) => p._id === searchedUser._id)
            );

            if (conversationAlreadyExists) {
                const other = getOtherParticipant(conversationAlreadyExists);
                setSelectedConversation({
                    _id: conversationAlreadyExists._id,
                    userId: other?._id || searchedUser._id,
                    username: other?.username || searchedUser.username,
                    userProfilePic: other?.profilePic || searchedUser.profilePic,
                });
                // clear search box
                setSearchText("");
                return;
            }

            // create a mock conversation (will be replaced by server-created conversation after first send)
            const mockConversation = {
                mock: true,
                lastMessage: {
                    text: "",
                    sender: "",
                },
                _id: `mock_${Date.now()}`,
                participants: [
                    {
                        _id: searchedUser._id,
                        username: searchedUser.username,
                        profilePic: searchedUser.profilePic,
                    },
                    {
                        _id: currentUser._id,
                        username: currentUser.username,
                        profilePic: currentUser.profilePic,
                    },
                ],
            };

            setConversations((prevConvs) => [...prevConvs, mockConversation]);

            setSelectedConversation({
                _id: mockConversation._id,
                userId: searchedUser._id,
                username: searchedUser.username,
                userProfilePic: searchedUser.profilePic,
            });

            setSearchText("");
        } catch (error) {
            showToast("Error", error.message, "error");
        } finally {
            setSearchingUser(false);
        }
    };

    return (
        <Box
            position={"absolute"}
            left={"50%"}
            w={{ base: "100%", md: "80%", lg: "750px" }}
            p={4}
            transform={"translateX(-50%)"}
        >
            <Flex
                gap={4}
                flexDirection={{ base: "column", md: "row" }}
                maxW={{
                    sm: "400px",
                    md: "full",
                }}
                mx={"auto"}
            >
                <Flex
                    flex={30}
                    gap={2}
                    flexDirection={"column"}
                    maxW={{ sm: "250px", md: "full" }}
                    mx={"auto"}
                >
                    <Text
                        fontWeight={700}
                        color={useColorModeValue("gray.600", "gray.400")}
                    >
                        Your Conversations
                    </Text>
                    <form onSubmit={handleConversationSearch}>
                        <Flex alignItems={"center"} gap={2}>
                            <Input
                                placeholder="Search for a user"
                                onChange={(e) => setSearchText(e.target.value)}
                                value={searchText}
                            />
                            <Button
                                size={"sm"}
                                onClick={handleConversationSearch}
                                isLoading={searchingUser}
                            >
                                <SearchIcon />
                            </Button>
                        </Flex>
                    </form>

                    {loadingConversations &&
                        [0, 1, 2, 3, 4].map((_, i) => (
                            <Flex
                                key={i}
                                gap={4}
                                alignItems={"center"}
                                p={"1"}
                                borderRadius={"md"}
                            >
                                <Box>
                                    <SkeletonCircle size={"10"} />
                                </Box>
                                <Flex w={"full"} flexDirection={"column"} gap={3}>
                                    <Skeleton h={"10px"} w={"80px"} />
                                    <Skeleton h={"8px"} w={"90%"} />
                                </Flex>
                            </Flex>
                        ))}

                    {!loadingConversations &&
                        conversations.map((conversation) => (
                            <Conversation
                                key={conversation._id}
                                isOnline={onlineUsers.includes(
                                    conversation.participants[0]?._id
                                )}
                                conversation={conversation}
                            />
                        ))}
                </Flex>

                {!selectedConversation || !selectedConversation._id ? (
                    <Flex
                        flex={70}
                        borderRadius={"md"}
                        p={2}
                        flexDir={"column"}
                        alignItems={"center"}
                        justifyContent={"center"}
                        height={"400px"}
                    >
                        <GiConversation size={100} />
                        <Text fontSize={20}>
                            Select a conversation to start messaging +
                        </Text>
                    </Flex>
                ) : (
                    <MessageContainer />
                )}
            </Flex>
        </Box>
    );
};

export default ChatPage;