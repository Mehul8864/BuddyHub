import { Box, Flex, Skeleton, SkeletonCircle, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import SuggestedUser from "./SuggestedUser";
import useShowToast from "../hooks/useShowToast";

const SuggestedUsers = () => {
  const [loading, setLoading] = useState(true);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const showToast = useShowToast();

  useEffect(() => {
    const controller = new AbortController();

    const getSuggestedUsers = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/users/suggested", {
          signal: controller.signal,
        });

        if (!res.ok) {
          // Try to extract a helpful message from the response body
          let errMessage = `Request failed with status ${res.status}`;
          try {
            const text = await res.text();
            if (text) errMessage = text;
          } catch (_) {}
          throw new Error(errMessage);
        }

        const data = await res.json();

        if (data && data.error) {
          showToast("Error", data.error, "error");
          setSuggestedUsers([]);
        } else if (Array.isArray(data)) {
          setSuggestedUsers(data);
        } else {
          // if API returns an object with e.g. { users: [...] }
          setSuggestedUsers(data.users ?? []);
        }
      } catch (error) {
        if (error.name === "AbortError") {
          // fetch was aborted — ignore
          return;
        }
        showToast("Error", error.message || "Something went wrong", "error");
        setSuggestedUsers([]);
      } finally {
        setLoading(false);
      }
    };

    getSuggestedUsers();

    return () => {
      controller.abort();
    };
  }, [showToast]);

  return (
    <>
      <Text mb={4} fontWeight={"bold"}>
        Suggested Users
      </Text>

      <Flex direction={"column"} gap={4}>
        {/* show actual list when loaded */}
        {!loading && suggestedUsers.length > 0 && (
          <>
            {suggestedUsers.map((user) => (
              <SuggestedUser key={user._id} user={user} />
            ))}
          </>
        )}

        {/* empty state */}
        {!loading && suggestedUsers.length === 0 && (
          <Flex
            p={3}
            borderRadius="md"
            alignItems="center"
            justifyContent="center"
            bg="gray.50"
          >
            <Text>No suggestions right now — try again later.</Text>
          </Flex>
        )}

        {/* skeletons while loading */}
        {loading &&
          [0, 1, 2, 3, 4].map((_, idx) => (
            <Flex
              key={idx}
              gap={2}
              alignItems={"center"}
              p={"1"}
              borderRadius={"md"}
            >
              <Box>
                <SkeletonCircle size={"10"} />
              </Box>

              <Flex w={"full"} flexDirection={"column"} gap={2}>
                <Skeleton h={"8px"} w={"80px"} />
                <Skeleton h={"8px"} w={"90px"} />
              </Flex>

              <Flex>
                <Skeleton h={"20px"} w={"60px"} />
              </Flex>
            </Flex>
          ))}
      </Flex>
    </>
  );
};

export default SuggestedUsers;