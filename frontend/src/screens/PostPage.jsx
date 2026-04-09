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
import { useRouter } from "next/router";
import { formatDistanceToNow } from "date-fns";
import { useRecoilState, useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import { DeleteIcon } from "@chakra-ui/icons";
import postsAtom from "../atoms/postsAtom";

const PostPage = () => {
    const { user, loading } = useGetUserProfile();
    const [posts, setPosts] = useRecoilState(postsAtom);
    const showToast = useShowToast();
    const router = useRouter();
    const pid = router.query.pid;
    const currentUser = useRecoilValue(userAtom);

    const currentPost =
        posts.find((p) => String(p._id) === String(pid)) || posts[0] || null;

    useEffect(() => {
        if (!router.isReady || !pid) return;

        const controller = new AbortController();
        const getPost = async () => {
            setPosts([]);
            try {
                const res = await fetch(`/api/posts/${pid}`, {
                    signal: controller.signal,
                });

                if (!res.ok) {
                    let errText = `Failed to load post (status ${res.status})`;
                    try {
                        const data = await res.json();
                        if (data && data.error) errText = data.error;
                    } catch (e) {}
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
                if (error.name === "AbortError") return;
                showToast("Error", error.message || "Failed to fetch post", "error");
            }
        };

        getPost();

        return () => controller.abort();
    }, [router.isReady, pid, showToast, setPosts]);

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

            setPosts((prev) => prev.filter((p) => p._id !== currentPost._id));

            showToast("Success", "Post deleted", "success");

            if (user?.username) router.push(`/${user.username}`);
            else router.push(`/`);
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