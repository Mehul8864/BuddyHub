import {
  Box,
  Flex,
  Spinner,
  IconButton,
  Heading,
  Text,
  Button,
  VStack,
} from "@chakra-ui/react";
import { RepeatIcon } from "@chakra-ui/icons";
import { useEffect, useState, useRef, useCallback } from "react";
import useShowToast from "../hooks/useShowToast";
import Post from "../components/Post";
import { useRecoilState } from "recoil";
import postsAtom from "../atoms/postsAtom";
import SuggestedUsers from "../components/SuggestedUsers";

const DEFAULT_LIMIT = 10;

const normalizePayload = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.posts)) return payload.posts;
  if (payload.success && Array.isArray(payload.payload)) return payload.payload;
  // Try nested shapes
  if (payload.data && Array.isArray(payload.data.posts)) return payload.data.posts;
  return [];
};

const HomePage = () => {
  const [posts, setPosts] = useRecoilState(postsAtom);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const showToast = useShowToast();
  const isMountedRef = useRef(true);

  // fetchPosts accepts an AbortSignal to allow caller to cancel
  const fetchPosts = useCallback(
    async ({ page = 1, limit = DEFAULT_LIMIT, signal } = {}) => {
      if (!isMountedRef.current) return;

      // If requesting page 1, treat as a full refresh
      const isRefresh = page === 1;
      try {
        if (isRefresh) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        // Build query string (backend should accept page & limit; harmless otherwise)
        const q = new URLSearchParams({ page: String(page), limit: String(limit) }).toString();
        const res = await fetch(`/api/posts/feed?${q}`, {
          credentials: "include",
          signal,
        });

        // attempt parsing; if invalid json, payload becomes null
        const payload = await res.json().catch(() => null);

        if (!res.ok) {
          const errMsg =
            (payload && (payload.message || payload.error)) ||
            res.statusText ||
            `Request failed with status ${res.status}`;
          showToast("Error", errMsg, "error");
          return;
        }

        const normalized = normalizePayload(payload);

        // If page 1 -> replace, else append
        if (isMountedRef.current) {
          setPosts((prev) => (page === 1 ? normalized : [...(Array.isArray(prev) ? prev : []), ...normalized]));
          // Simple hasMore detection: if returned fewer than limit, assume no more
          setHasMore(Array.isArray(normalized) ? normalized.length >= limit : false);
        }
      } catch (error) {
        if (error.name === "AbortError") {
          // expected on unmount or cancel
          console.log("Feed fetch aborted");
        } else {
          showToast("Error", error.message || "Failed to load feed", "error");
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [setPosts, showToast]
  );

  // Initial load & cleanup
  useEffect(() => {
    isMountedRef.current = true;
    const controller = new AbortController();
    fetchPosts({ page: 1, limit: DEFAULT_LIMIT, signal: controller.signal });

    return () => {
      // cleanup
      isMountedRef.current = false;
      controller.abort();
    };
  }, [fetchPosts]);

  // Handlers
  const handleRefresh = async () => {
    // create new controller for manual refresh
    const controller = new AbortController();
    setPage(1);
    await fetchPosts({ page: 1, limit: DEFAULT_LIMIT, signal: controller.signal });
  };

  const handleLoadMore = async () => {
    const next = page + 1;
    const controller = new AbortController();
    setPage(next);
    await fetchPosts({ page: next, limit: DEFAULT_LIMIT, signal: controller.signal });
  };

  const hasPosts = Array.isArray(posts) && posts.length > 0;

  return (
    <Flex gap="10" alignItems={"flex-start"}>
      <Box flex={70}>
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="md">Your Feed</Heading>
          <IconButton
            aria-label="Refresh feed"
            icon={<RepeatIcon />}
            onClick={handleRefresh}
            isLoading={loading}
            size="sm"
          />
        </Flex>

        {!loading && !hasPosts && (
          <Box p={6} borderWidth="1px" borderRadius="md">
            <VStack spacing={3} align="start">
              <Heading size="sm">Follow some users to see the feed</Heading>
              <Text>If you already follow users, try refreshing the feed.</Text>
              <Button size="sm" onClick={handleRefresh}>
                Refresh
              </Button>
            </VStack>
          </Box>
        )}

        {loading && (
          <Flex justify="center" py={8}>
            <Spinner size="xl" />
          </Flex>
        )}

        {hasPosts &&
          posts.map((post, idx) => {
            const key = post?._id ?? post?.id ?? `post-${idx}`;
            return <Post key={key} post={post} postedBy={post?.postedBy} />;
          })}

        {/* Load more */}
        {hasPosts && hasMore && (
          <Flex justify="center" mt={6}>
            <Button onClick={handleLoadMore} isLoading={loadingMore}>
              Load more
            </Button>
          </Flex>
        )}
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