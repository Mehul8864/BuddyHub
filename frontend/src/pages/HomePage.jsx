// src/pages/HomePage.jsx
import { Box, Flex, Spinner } from "@chakra-ui/react";
import { useEffect, useState, useRef } from "react";
import useShowToast from "../hooks/useShowToast";
import Post from "../components/Post";
import { useRecoilState } from "recoil";
import postsAtom from "../atoms/postsAtom";
import SuggestedUsers from "../components/SuggestedUsers";

const HomePage = () => {
  const [posts, setPosts] = useRecoilState(postsAtom);
  const [loading, setLoading] = useState(true);
  const showToast = useShowToast();
  const isMountedRef = useRef(true);

  useEffect(() => {
    // cleanup flag
    isMountedRef.current = true;
    const controller = new AbortController();

    const getFeedPosts = async () => {
      if (!isMountedRef.current) return;
      setLoading(true);
      setPosts([]);

      try {
        const res = await fetch("/api/posts/feed", {
          // If your backend uses cookies/sessions for auth, enable credentials.
          // Remove or change if CORS/front-end config differs.
          credentials: "include",
          signal: controller.signal,
        });

        // Attempt to parse JSON (may throw)
        const payload = await res.json().catch(() => null);

        // Handle HTTP errors first
        if (!res.ok) {
          const errMsg =
            (payload && (payload.message || payload.error)) ||
            res.statusText ||
            `Request failed with status ${res.status}`;
          showToast("Error", errMsg, "error");
          return;
        }

        // Normalize possible response shapes:
        // - an array: []
        // - { data: [...] }
        // - { posts: [...] }
        // - { success: true, data: [...] }
        let normalized = [];
        if (Array.isArray(payload)) {
          normalized = payload;
        } else if (payload && Array.isArray(payload.data)) {
          normalized = payload.data;
        } else if (payload && Array.isArray(payload.posts)) {
          normalized = payload.posts;
        } else if (payload && payload.success && Array.isArray(payload.payload)) {
          // fallback for other naming conventions
          normalized = payload.payload;
        } else {
          // If payload is empty or unexpected, try to fallback gracefully
          normalized = [];
        }

        if (isMountedRef.current) {
          setPosts(normalized);
        }
      } catch (error) {
        // If the fetch was aborted, don't show a toast
        if (error.name === "AbortError") {
          console.log("Feed request aborted");
        } else {
          showToast("Error", error.message || "Failed to load feed", "error");
        }
      } finally {
        if (isMountedRef.current) setLoading(false);
      }
    };

    getFeedPosts();

    return () => {
      // mark unmounted and abort in-flight requests
      isMountedRef.current = false;
      controller.abort();
    };
    // We intentionally include setPosts and showToast (stable hooks) in deps
    // so the effect re-runs if they change.
  }, [setPosts, showToast]);

  const hasPosts = Array.isArray(posts) && posts.length > 0;

  return (
    <Flex gap="10" alignItems={"flex-start"}>
      <Box flex={70}>
        {!loading && !hasPosts && <h1>Follow some users to see the feed</h1>}

        {loading && (
          <Flex justify="center">
            <Spinner size="xl" />
          </Flex>
        )}

        {hasPosts &&
          posts.map((post) => (
            <Post key={post._id ?? post.id ?? JSON.stringify(post)} post={post} postedBy={post.postedBy} />
          ))}
      </Box>

      <Box
        flex={30}
        display={{
          base: "none",
          md: "block",
        }}
      >
        <SuggestedUsers />
      </Box>
    </Flex>
  );
};

export default HomePage;