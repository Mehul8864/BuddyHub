import React, { useState } from "react";
import { Avatar, Box, Flex, Image, Skeleton, Text } from "@chakra-ui/react";
import { selectedConversationAtom } from "../atoms/messagesAtom";
import { useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import { BsCheck2All } from "react-icons/bs";

const ImageWithSkeleton = ({ src, alt = "Message image", showCheck = false, seen = false }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <Box mt={5} w="200px" position="relative">
      <Skeleton isLoaded={loaded} w="200px" h="200px" borderRadius="md" overflow="hidden">
        {/* Image will call onLoad and then Skeleton will show the loaded image */}
        <Image
          src={src}
          alt={alt}
          w="200px"
          h="200px"
          objectFit="cover"
          borderRadius="md"
          onLoad={() => setLoaded(true)}
        />
      </Skeleton>

      {showCheck && (
        <Box position="absolute" bottom={1} right={1} ml={1} color={seen ? "blue.400" : undefined} fontWeight="bold">
          <BsCheck2All size={16} />
        </Box>
      )}
    </Box>
  );
};

const Message = ({ ownMessage, message }) => {
  const selectedConversation = useRecoilValue(selectedConversationAtom);
  const user = useRecoilValue(userAtom);

  return (
    <>
      {ownMessage ? (
        <Flex gap={2} alignSelf="flex-end" alignItems="flex-end">
          {message.text && (
            <Flex bg="green.800" maxW="350px" p={2} borderRadius="md" alignItems="center">
              <Text color="white" wordBreak="break-word">
                {message.text}
              </Text>
              <Box ml={2} color={message.seen ? "blue.400" : undefined} fontWeight="bold">
                <BsCheck2All size={16} />
              </Box>
            </Flex>
          )}

          {message.img && (
            <ImageWithSkeleton src={message.img} alt={message.text ? `${message.text} image` : "Sent image"} showCheck={true} seen={message.seen} />
          )}

          <Avatar src={user?.profilePic} boxSize="7" />
        </Flex>
      ) : (
        <Flex gap={2} alignItems="flex-start">
          <Avatar src={selectedConversation?.userProfilePic} boxSize="7" />

          {message.text && (
            <Text maxW="350px" bg="gray.400" p={2} borderRadius="md" color="black" wordBreak="break-word">
              {message.text}
            </Text>
          )}

          {message.img && <ImageWithSkeleton src={message.img} alt={message.text ? `${message.text} image` : "Received image"} />}
        </Flex>
      )}
    </>
  );
};

export default React.memo(Message);