import { useState } from "react";
import { Button, Text } from "@chakra-ui/react";
import useShowToast from "../hooks/useShowToast";
import useLogout from "../hooks/useLogout";

export const SettingsPage = () => {
    const showToast = useShowToast();
    const logout = useLogout();
    const [isFreezing, setIsFreezing] = useState(false);

    const freezeAccount = async () => {
        const confirmed = window.confirm(
            "Are you sure you want to freeze your account?"
        );

        if (!confirmed) return;

        setIsFreezing(true);

        try {
            const res = await fetch("/api/users/freeze", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const data = await res.json();

            if (!res.ok || data.error) {
                showToast("Error", data.error || "Failed to freeze account", "error");
                return;
            }

            showToast("Success", "Your account has been frozen", "success");
            await logout();
        } catch (error) {
            if (error instanceof Error) {
                showToast("Error", error.message, "error");
            } else {
                showToast("Error", "Something went wrong", "error");
            }
        } finally {
            setIsFreezing(false);
        }
    };

    return (
        <>
            <Text my={1} fontWeight="bold">
                Freeze Your Account
            </Text>
            <Text my={1}>You can unfreeze your account anytime by logging in.</Text>
            <Button
                size="sm"
                colorScheme="red"
                onClick={freezeAccount}
                isLoading={isFreezing}
                loadingText="Freezing"
            >
                Freeze
            </Button>
        </>
    );
};