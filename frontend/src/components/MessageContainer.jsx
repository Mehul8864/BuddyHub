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
import messageSound from "../assets/sounds/message.mp3";

const MessageContainer = () => {
  const showToast = useShowToast();
  const selectedConversation = useRecoilValue(selectedConversationAtom);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [messages, setMessages] = useState([]);
  const currentUser = useRecoilValue(userAtom);
  const { socket } = useSocket();
  const setConversations = useSetRecoilState(conversationsAtom);
  const messageEndRef = useRef(null);

  // Refs to keep handlers stable and access latest values inside socket callbacks
  const selectedConvRef = useRef(selectedConversation);
  const currentUserRef = useRef(currentUser);
  const audioRef = useRef(null);

  useEffect(() => {
    selectedConvRef.current = selectedConversation;
  }, [selectedConversation]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Initialize one Audio instance
  useEffect(() => {
    try {
      audioRef.current = new Audio(messageSound);
    } catch (err) {
      // ignore audio init errors
      audioRef.current = null;
    }
  }, []);

  // Socket: newMessage handler (stable add/remove)
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      // Update conversations lastMessage regardless (so list updates)
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

      // If the incoming message belongs to the opened conversation, append it
      if (selectedConvRef.current?._id === message.conversationId) {
        setMessages((prev) => [...prev, message]);
      }

      // Play notification if window not focused
      if (!document.hasFocus() && audioRef.current) {
        // try/catch to avoid uncaught promise rejections
        audioRef.current
          .play()
          .catch(() => {
            /* ignore autoplay policies failures */
          });
      }
    };

    socket.on("newMessage", handleNewMessage);
    return () => {
      // remove only that handler
      socket.off("newMessage", handleNewMessage);
    };
    // We intentionally do not include selectedConversation or messages here:
    // handler uses refs to access latest values.
  }, [socket, setConversations]);

  // Socket: messagesSeen updates
  useEffect(() => {
    if (!socket) return;

    const handleMessagesSeen = ({ conversationId }) => {
      // Only update if the currently open conversation was affected
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

  // Mark messages as seen when the last message is from someone else and is not seen yet
  useEffect(() => {
    if (!socket) return;
    if (!selectedConversation?._id) return;
    if (!messages?.length) return;

    const last = messages[messages.length - 1];
    const lastIsFromOtherUser =
      last && last.sender !== currentUserRef.current?._id;
    const lastNotSeen = last && !last.seen;

    if (lastIsFromOtherUser && lastNotSeen) {
      socket.emit("markMessagesAsSeen", {
        conversationId: selectedConversation._id,
        userId: selectedConversation.userId,
      });
      // we rely on server to emit back "messagesSeen" to finally mark them as seen
    }
    // only re-run when messages or selectedConversation changes
  }, [messages, selectedConversation?._id, socket]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch messages when selectedConversation changes
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
    // we only want to run when selectedConversation.userId or mock changes
  }, [showToast, selectedConversation?.userId, selectedConversation?.mock]);

  return (
    <Flex
      flex="70"
      bg={useColorModeValue("gray.200", "gray.dark")}
      borderRadius={"md"}
      p={2}
      flexDirection={"column"}
    >
      {/* Message header */}
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