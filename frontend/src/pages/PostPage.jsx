// PostPage.jsx
import {
  Avatar,
  Box,
  Button,
  Divider,
  Flex,
  Image,
  Spinner,
  Text,
} from "@chakra-ui/react";
import Actions from "../components/Actions";
import { useEffect } from "react";
import Comment from "../components/Comment";
import useGetUserProfile from "../hooks/useGetUserProfile";
import useShowToast from "../hooks/useShowToast";
import { useNavigate, useParams } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useRecoilState, useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import { DeleteIcon } from "@chakra-ui/icons";
import postsAtom from "../atoms/postsAtom";

const PostPage = () => {
  const { user, loading } = useGetUserProfile();
  const [posts, setPosts] = useRecoilState(postsAtom);
  const showToast = useShowToast();
  const { pid } = useParams();
  const currentUser = useRecoilValue(userAtom);
  const navigate = useNavigate();

  // pick post by pid; fallback to first item if pid not present
  const currentPost =
    posts.find((p) => String(p._id) === String(pid)) || posts[0] || null;

  useEffect(() => {
    const controller = new AbortController();
    const getPost = async () => {
      // clear previous post while loading new one
      setPosts([]);
      try {
        const res = await fetch(`/api/posts/${pid}`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          // try to parse server message if any
          let errText = `Failed to load post (status ${res.status})`;
          try {
            const data = await res.json();
            if (data && data.error) errText = data.error;
          } catch (e) {
            // ignore parse error
          }
          showToast("Error", errText, "error");
          return;
        }

        const data = await res.json();
        if (data.error) {
          showToast("Error", data.error, "error");
          return;
        }
        setPosts([data]);
      } catch (error) {
        if (error.name === "AbortError") return; // fetch aborted
        showToast("Error", error.message || "Failed to fetch post", "error");
      }
    };

    if (pid) getPost();

    return () => controller.abort();
  }, [showToast, pid, setPosts]);

  const handleDeletePost = async () => {
    if (!currentPost) return;
    try {
      if (!window.confirm("Are you sure you want to delete this post?"))
        return;

      const res = await fetch(`/api/posts/${currentPost._id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        const msg = data?.error || `Delete failed (status ${res.status})`;
        showToast("Error", msg, "error");
        return;
      }

      // remove deleted post from state
      setPosts((prev) => prev.filter((p) => p._id !== currentPost._id));

      showToast("Success", "Post deleted", "success");

      // navigate to user's profile if available, otherwise to home
      if (user?.username) navigate(`/${user.username}`);
      else navigate(`/`);
    } catch (error) {
      showToast("Error", error.message || "Delete request failed", "error");
    }
  };

  if (loading) {
    return (
      <Flex justifyContent={"center"}>
        <Spinner size={"xl"} />
      </Flex>
    );
  }

  // If loading finished but no user found, show friendly fallback
  if (!user) {
    return (
      <Flex justifyContent={"center"} py={8}>
        <Text>Unable to find user. Please try again or go back.</Text>
      </Flex>
    );
  }

  if (!currentPost) {
    return (
      <Flex justifyContent={"center"} py={8}>
        <Text>No post found.</Text>
      </Flex>
    );
  }

  return (
    <>
      <Flex>
        <Flex w={"full"} alignItems={"center"} gap={3}>
          <Avatar
            src={user.profilePic}
            size={"md"}
            name={user.username || "User"}
            aria-label={`${user.username || "user"} avatar`}
          />
          <Flex>
            <Text fontSize={"sm"} fontWeight={"bold"}>
              {user.username}
            </Text>
            <Image src="/verified.png" w="4" h={4} ml={4} alt="verified" />
          </Flex>
        </Flex>

        <Flex gap={4} alignItems={"center"}>
          <Text
            fontSize={"xs"}
            width={36}
            textAlign={"right"}
            color={"gray.light"}
          >
            {formatDistanceToNow(new Date(currentPost.createdAt))} ago
          </Text>

          {currentUser?._id === user._id && (
            <DeleteIcon
              boxSize={5}
              cursor={"pointer"}
              onClick={handleDeletePost}
              aria-label="delete post"
            />
          )}
        </Flex>
      </Flex>

      <Text my={3}>{currentPost.text}</Text>

      {currentPost.img && (
        <Box
          borderRadius={6}
          overflow={"hidden"}
          border={"1px solid"}
          borderColor={"gray.light"}
        >
          <Image src={currentPost.img} w={"full"} alt="post media" />
        </Box>
      )}

      <Flex gap={3} my={3}>
        <Actions post={currentPost} />
      </Flex>

      <Divider my={4} />

      <Flex justifyContent={"space-between"}>
        <Flex gap={2} alignItems={"center"}>
          <Text fontSize={"2xl"}>👋</Text>
          <Text color={"gray.light"}>Get the app to like, reply and post.</Text>
        </Flex>
        <Button>Get</Button>
      </Flex>

      <Divider my={4} />
      {(currentPost.replies || []).map((reply) => (
        <Comment
          key={reply._id}
          reply={reply}
          lastReply={
            reply._id ===
            (currentPost.replies && currentPost.replies.length
              ? currentPost.replies[currentPost.replies.length - 1]._id
              : reply._id)
          }
        />
      ))}
    </>
  );
};

export default PostPage;
