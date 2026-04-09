import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import useShowToast from "./useShowToast";

const useGetUserProfile = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const username = router.query.username;
    const showToast = useShowToast();

    useEffect(() => {
        if (!router.isReady || !username) return;

        const getUser = async () => {
            try {
                const res = await fetch(`/api/users/profile/${username}`);
                const data = await res.json();
                if (data.error) {
                    showToast("Error", data.error, "error");
                    return;
                }
                if (data.isFrozen) {
                    setUser(null);
                    return;
                }
                setUser(data);
            } catch (error) {
                showToast("Error", error.message, "error");
            } finally {
                setLoading(false);
            }
        };

        getUser();
    }, [router.isReady, username, showToast]);

    return { loading, user };
};

export default useGetUserProfile;