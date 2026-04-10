import {
    Flex,
    Image,
    Input,
    InputGroup,
    InputRightElement,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay,
    Spinner,
    useDisclosure,
    IconButton,
} from "@chakra-ui/react";
import { useRef, useState, useCallback } from "react";
import { IoSendSharp } from "react-icons/io5";
import useShowToast from "../hooks/useShowToast";
import { conversationsAtom, selectedConversationAtom } from "../atoms/messagesAtom";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { BsFillImageFill } from "react-icons/bs";
import usePreviewImg from "../hooks/usePreviewImg";
import { useSocket } from "../context/SocketContext";

const MessageInput = ({ setMessages }) => {
    const [messageText, setMessageText] = useState("");
    const showToast = useShowToast();
    const selectedConversation = useRecoilValue(selectedConversationAtom);
    const setConversations = useSetRecoilState(conversationsAtom);
    const imageRef = useRef(null);
    const { onClose } = useDisclosure();
    const { handleImageChange, imgUrl, setImgUrl } = usePreviewImg();
    const [isSending, setIsSending] = useState(false);
    const { socket } = useSocket();
    const typingTimeoutRef = useRef(null);

    const handleTyping = useCallback((e) => {
        setMessageText(e.target.value);
        if (!socket || !selectedConversation?.userId) return;

        socket.emit("typing", {
            conversationId: selectedConversation._id,
            recipientId: selectedConversation.userId,
        });

        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit("stopTyping", {
                conversationId: selectedConversation._id,
                recipientId: selectedConversation.userId,
            });
        }, 1500);
    }, [socket, selectedConversation]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!messageText && !imgUrl) return;
        if (isSending) return;

        // Stop typing indicator
        if (socket && selectedConversation?.userId) {
            socket.emit("stopTyping", {
                conversationId: selectedConversation._id,
                recipientId: selectedConversation.userId,
            });
        }

        setIsSending(true);
        try {
            const res = await fetch("/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: messageText,
                    recipientId: selectedConversation.userId,
                    img: imgUrl,
                }),
            });
            const data = await res.json();
            if (data.error) { showToast("Error", data.error, "error"); return; }

            setMessages((messages) => [...messages, data]);
            setConversations((prevConvs) =>
                prevConvs.map((conversation) =>
                    conversation._id === selectedConversation._id
                        ? { ...conversation, lastMessage: { text: messageText, sender: data.sender } }
                        : conversation
                )
            );
            setMessageText("");
            setImgUrl("");
        } catch (error) {
            showToast("Error", error.message, "error");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Flex gap={2} alignItems={"center"}>
            <form onSubmit={handleSendMessage} style={{ flex: 95 }}>
                <InputGroup>
                    <Input
                        w={"full"}
                        placeholder="Type a message"
                        onChange={handleTyping}
                        value={messageText}
                    />
                    <InputRightElement onClick={handleSendMessage} cursor={"pointer"}>
                        <IoSendSharp />
                    </InputRightElement>
                </InputGroup>
            </form>
            <Flex flex={5} cursor={"pointer"}>
                <BsFillImageFill size={20} onClick={() => imageRef.current.click()} />
                <Input type={"file"} hidden ref={imageRef} onChange={handleImageChange} />
            </Flex>
            <Modal
                isOpen={!!imgUrl}
                onClose={() => { onClose(); setImgUrl(""); }}
            >
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader></ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Flex mt={5} w={"full"}>
                            <Image src={imgUrl} />
                        </Flex>
                        <Flex justifyContent={"flex-end"} my={2}>
                            {!isSending ? (
                                <IoSendSharp size={24} cursor={"pointer"} onClick={handleSendMessage} />
                            ) : (
                                <Spinner size={"md"} />
                            )}
                        </Flex>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Flex>
    );
};

export default MessageInput;
