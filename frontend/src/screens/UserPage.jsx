import React, { useEffect, useState } from "react";
import UserHeader from "../components/UserHeader";
import { useParams } from "react-router-dom";
import useShowToast from "../hooks/useShowToast";
import { Flex, Spinner } from "@chakra-ui/react";
import Post from "../components/Post";
import useGetUserProfile from "../hooks/useGetUserProfile";
import { useRecoilState } from "recoil";
import postsAtom from "../atoms/postsAtom";

const UserPage = () => {
    const { user, loading } = useGetUserProfile();
    const { username } = useParams();
    const showToast = useShowToast();
    const [posts, setPosts] = useRecoilState(postsAtom);
    const [fetchingPosts, setFetchingPosts] = useState(true);

    useEffect(() => {
        if (!username || !user) return;

        let mounted = true;
        const controller = new AbortController();
        const { signal } = controller;

        const getPosts = async () => {
            setFetchingPosts(true);
            try {
                const url = `/api/posts/user/${encodeURIComponent(username)}`;
                const res = await fetch(url, { signal });

                if (!res.ok) {
                    let msg = `${res.status} ${res.statusText}`;
                    try {
                        const text = await res.text();
                        if (text) msg = text;
                    } catch (e) {}
                    throw new Error(msg);
                }

                const data = await res.json();

                if (!mounted || signal.aborted) return;

                setPosts(Array.isArray(data) ? data : []);
            } catch (err) {
                if (err && err.name === "AbortError") return;

                const message = err && err.message ? err.message : String(err);
                try {
                    showToast("Error", message, "error");
                } catch (e) {}

                if (mounted && !signal.aborted) {
                    setPosts([]);
                }
            } finally {
                if (mounted && !signal.aborted) setFetchingPosts(false);
            }
        };

        getPosts();

        return () => {
            mounted = false;
            controller.abort();
        };
    }, [username, user, setPosts, showToast]);

    if (!user && loading) {
        return (
            <Flex justifyContent={"center"}>
                <Spinner size={"xl"} />
            </Flex>
        );
    }

    if (!user && !loading) return <h1>User not found</h1>;

    return (
        <>
            <UserHeader user={user} />

            {!fetchingPosts && (!posts || posts.length === 0) && (
                <h1>User has no posts.</h1>
            )}

            {fetchingPosts && (
                <Flex justifyContent={"center"} my={12}>
                    <Spinner size={"xl"} />
                </Flex>
            )}

            {posts &&
                posts.map((post) => (
                    <Post key={post._id} post={post} postedBy={post.postedBy} />
                ))}
        </>
    );
};

export default UserPage;