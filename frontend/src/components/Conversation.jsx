import React from "react";
import {
  Avatar,
  AvatarBadge,
  Box,
  Flex,
  Image,
  Stack,
  Text,
  WrapItem,
  useColorMode,
  useColorModeValue,
} from "@chakra-ui/react";
import { useRecoilState, useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import { BsCheck2All, BsFillImageFill } from "react-icons/bs";
import { selectedConversationAtom } from "../atoms/messagesAtom";

const Conversation = ({ conversation = {}, isOnline }) => {
  const user = conversation.participants?.[0] || {};
  const currentUser = useRecoilValue(userAtom) || {};
  const lastMessage = conversation.lastMessage || {};
  const [selectedConversation, setSelectedConversation] = useRecoilState(
    selectedConversationAtom
  );
  const { colorMode } = useColorMode();

  const hoverBg = useColorModeValue("gray.100", "gray.700");
  const selectedBg = useColorModeValue("gray.200", "gray.700");

  const textPreview =
    typeof lastMessage.text === "string" && lastMessage.text.length > 0 ? (
      lastMessage.text.length > 18 ? (
        lastMessage.text.substring(0, 18) + "..."
      ) : (
        lastMessage.text
      )
    ) : (
      <BsFillImageFill size={16} />
    );

  return (
    <Flex
      gap={4}
      alignItems={"center"}
      p={"1"}
      _hover={{
        cursor: "pointer",
        bg: hoverBg,
      }}
      onClick={() =>
        setSelectedConversation({
          _id: conversation._id,
          userId: user._id,
          userProfilePic: user.profilePic,
          username: user.username,
          mock: conversation.mock,
        })
      }
      bg={
        selectedConversation?._id === conversation._id
          ? selectedBg
          : undefined
      }
      borderRadius={"md"}
    >
      <WrapItem>
        <Avatar
          size={{
            base: "xs",
            sm: "sm",
            md: "md",
          }}
          src={user.profilePic}
          name={user.username}
        >
          {isOnline ? <AvatarBadge boxSize="1em" bg="green.500" /> : null}
        </Avatar>
      </WrapItem>

      <Stack direction={"column"} fontSize={"sm"}>
        <Text fontWeight="700" display={"flex"} alignItems={"center"}>
          {user.username || "Unknown"}{" "}
          <Image src="/verified.png" alt="verified" w={4} h={4} ml={1} />
        </Text>

        <Text fontSize={"xs"} display={"flex"} alignItems={"center"} gap={1}>
          {currentUser._id && lastMessage.sender && currentUser._id === lastMessage.sender ? (
            <Box color={lastMessage.seen ? "blue.400" : "inherit"}>
              <BsCheck2All size={16} />
            </Box>
          ) : null}

          {textPreview}
        </Text>
      </Stack>
    </Flex>
  );
};

export default Conversation;