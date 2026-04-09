import {
  Avatar,
  Divider,
  Flex,
  Image,
  Skeleton,
  SkeletonCircle,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import Message from "./Message";
import MessageInput from "./MessageInput";
import { useEffect, useRef, useState } from "react";
import useShowToast from "../hooks/useShowToast";
import {
  conversationsAtom,
  selectedConversationAtom,
} from "../atoms/messagesAtom";
import { useRecoilValue, useSetRecoilState } from "recoil";
import userAtom from "../atoms/userAtom";
import { useSocket } from "../context/SocketContext.jsx";

const messageSound = "/sounds/message.mp3";

const MessageContainer = () => {
  const showToast = useShowToast();
  const selectedConversation = useRecoilValue(selectedConversationAtom);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [messages, setMessages] = useState([]);
  const currentUser = useRecoilValue(userAtom);
  const { socket } = useSocket();
  const setConversations = useSetRecoilState(conversationsAtom);
  const messageEndRef = useRef(null);

  const selectedConvRef = useRef(selectedConversation);
  const currentUserRef = useRef(currentUser);
  const audioRef = useRef(null);

  useEffect(() => {
    selectedConvRef.current = selectedConversation;
  }, [selectedConversation]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    try {
      audioRef.current = new Audio(messageSound);
    } catch (err) {
      audioRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation._id === message.conversationId
            ? {
                ...conversation,
                lastMessage: {
                  text: message.text,
                  sender: message.sender,
                },
              }
            : conversation
        )
      );

      if (selectedConvRef.current?._id === message.conversationId) {
        setMessages((prev) => [...prev, message]);
      }

      if (!document.hasFocus() && audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
    };

    socket.on("newMessage", handleNewMessage);
    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [socket, setConversations]);

  useEffect(() => {
    if (!socket) return;

    const handleMessagesSeen = ({ conversationId }) => {
      if (selectedConvRef.current?._id === conversationId) {
        setMessages((prev) =>
          prev.map((msg) => (msg.seen ? msg : { ...msg, seen: true }))
        );
      }
    };

    socket.on("messagesSeen", handleMessagesSeen);
    return () => {
      socket.off("messagesSeen", handleMessagesSeen);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;
    if (!selectedConversation?._id) return;
    if (!messages?.length) return;

    const last = messages[messages.length - 1];
    const lastIsFromOtherUser = last && last.sender !== currentUserRef.current?._id;
    const lastNotSeen = last && !last.seen;

    if (lastIsFromOtherUser && lastNotSeen) {
      socket.emit("markMessagesAsSeen", {
        conversationId: selectedConversation._id,
        userId: selectedConversation.userId,
      });
    }
  }, [messages, selectedConversation?._id, socket]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const getMessages = async () => {
      setLoadingMessages(true);
      setMessages([]);
      try {
        if (!selectedConversation || selectedConversation.mock) {
          return;
        }
        if (!selectedConversation.userId) {
          showToast("Error", "Selected conversation has no userId", "error");
          return;
        }

        const res = await fetch(`/api/messages/${selectedConversation.userId}`);
        const data = await res.json();
        if (data?.error) {
          showToast("Error", data.error, "error");
          return;
        }
        setMessages(Array.isArray(data) ? data : []);
      } catch (error) {
        showToast("Error", error?.message || "Failed to fetch messages", "error");
      } finally {
        setLoadingMessages(false);
      }
    };

    getMessages();
  }, [showToast, selectedConversation?.userId, selectedConversation?.mock]);

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

      <Flex
        flexDir={"column"}
        gap={4}
        my={4}
        p={2}
        height={"400px"}
        overflowY={"auto"}
      >
        {loadingMessages &&
          [...Array(5)].map((_, i) => (
            <Flex
              key={i}
              gap={2}
              alignItems={"center"}
              p={1}
              borderRadius={"md"}
              alignSelf={i % 2 === 0 ? "flex-start" : "flex-end"}
            >
              {i % 2 === 0 && <SkeletonCircle size={7} />}
              <Flex flexDir={"column"} gap={2}>
                <Skeleton h="8px" w="250px" />
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
              />
            </Flex>
          ))}
      </Flex>

      <MessageInput setMessages={setMessages} />
    </Flex>
  );
};

export default MessageContainer;