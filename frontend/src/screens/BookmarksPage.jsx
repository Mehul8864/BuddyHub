import { Box, Flex, Heading, Spinner, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useRecoilState } from "recoil";
import postsAtom from "../atoms/postsAtom";
import Post from "../components/Post";
import useShowToast from "../hooks/useShowToast";

const BookmarksPage = () => {
    const [posts, setPosts] = useRecoilState(postsAtom);
    const [loading, setLoading] = useState(true);
    const showToast = useShowToast();

    useEffect(() => {
        const fetchBookmarks = async () => {
            try {
                const res = await fetch("/api/posts/bookmarks");
                const data = await res.json();
                if (data.error) { showToast("Error", data.error, "error"); return; }
                setPosts(Array.isArray(data) ? data : []);
            } catch (err) {
                showToast("Error", err.message, "error");
            } finally {
                setLoading(false);
            }
        };
        fetchBookmarks();
    }, [showToast, setPosts]);

    if (loading) return <Flex justify="center" py={10}><Spinner size="xl" /></Flex>;

    return (
        <Box>
            <Heading size="md" mb={4}>Saved Posts</Heading>
            {posts.length === 0 && (
                <Flex justify="center" py={10} direction="column" align="center" gap={2}>
                    <Text fontSize="3xl">🔖</Text>
                    <Text color="gray.500">No saved posts yet</Text>
                </Flex>
            )}
            {posts.map((post) => (
                <Post key={post._id} post={post} postedBy={post.postedBy} />
            ))}
        </Box>
    );
};

export default BookmarksPage;
