import { Button, Flex, Image, Link, useColorMode } from "@chakra-ui/react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import userAtom from "../atoms/userAtom";
import { AiFillHome } from "react-icons/ai";
import { RxAvatar } from "react-icons/rx";
import NextLink from "next/link";
import { FiLogOut } from "react-icons/fi";
import useLogout from "../hooks/useLogout";
import authScreenAtom from "../atoms/authAtom";
import { BsFillChatQuoteFill } from "react-icons/bs";
import { MdOutlineSettings } from "react-icons/md";

const Header = () => {
    const { colorMode, toggleColorMode } = useColorMode();
    const user = useRecoilValue(userAtom);
    const logout = useLogout();
    const setAuthScreen = useSetRecoilState(authScreenAtom);

    return (
        <Flex justifyContent={"space-between"} mt={6} mb="12">
            {user && (
                <Link as={NextLink} href="/">
                    <AiFillHome size={24} />
                </Link>
            )}

            {!user && (
                <Link
                    as={NextLink}
                    href="/auth"
                    onClick={() => setAuthScreen("login")}
                >
                    Login
                </Link>
            )}

            <Image
                cursor={"pointer"}
                alt="logo"
                w={6}
                src={colorMode === "dark" ? "/light-logo.svg" : "/dark-logo.svg"}
                onClick={toggleColorMode}
            />

            {user && (
                <Flex alignItems={"center"} gap={4}>
                    <Link as={NextLink} href={`/${user.username}`}>
                        <RxAvatar size={24} />
                    </Link>
                    <Link as={NextLink} href="/chat">
                        <BsFillChatQuoteFill size={20} />
                    </Link>
                    <Link as={NextLink} href="/settings">
                        <MdOutlineSettings size={20} />
                    </Link>
                    <Button size={"xs"} onClick={logout}>
                        <FiLogOut size={20} />
                    </Button>
                </Flex>
            )}

            {!user && (
                <Link
                    as={NextLink}
                    href="/auth"
                    onClick={() => setAuthScreen("signup")}
                >
                    Sign up
                </Link>
            )}
        </Flex>
    );
};

export default Header;