import { Button, Flex, Image, useColorMode, Badge, Box } from "@chakra-ui/react";
import { useRecoilValue, useSetRecoilState, useRecoilState } from "recoil";
import userAtom from "../atoms/userAtom";
import { AiFillHome } from "react-icons/ai";
import { RxAvatar } from "react-icons/rx";
import { Link } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";
import useLogout from "../hooks/useLogout";
import authScreenAtom from "../atoms/authAtom";
import { BsFillChatQuoteFill, BsBookmarkFill } from "react-icons/bs";
import { MdOutlineSettings, MdNotifications } from "react-icons/md";
import { SearchIcon } from "@chakra-ui/icons";
import { unreadCountAtom } from "../atoms/notificationsAtom";
import { useEffect } from "react";

const Header = () => {
    const { colorMode, toggleColorMode } = useColorMode();
    const user = useRecoilValue(userAtom);
    const logout = useLogout();
    const setAuthScreen = useSetRecoilState(authScreenAtom);
    const [unreadCount, setUnreadCount] = useRecoilState(unreadCountAtom);

    useEffect(() => {
        if (!user) return;
        const fetchCount = async () => {
            try {
                const res = await fetch("/api/notifications/unread-count");
                const data = await res.json();
                if (!data.error) setUnreadCount(data.count);
            } catch {}
        };
        fetchCount();
    }, [user, setUnreadCount]);

    return (
        <Flex justifyContent={"space-between"} mt={6} mb="12" alignItems="center">
            {user && (
                <Link to="/">
                    <AiFillHome size={24} />
                </Link>
            )}

            {!user && (
                <Link to="/auth" onClick={() => setAuthScreen("login")}>
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
                    <Link to={`/${user.username}`}>
                        <RxAvatar size={24} />
                    </Link>
                    <Link to="/search">
                        <SearchIcon boxSize={5} />
                    </Link>
                    <Link to="/chat">
                        <BsFillChatQuoteFill size={20} />
                    </Link>
                    <Link to="/notifications">
                        <Box position="relative" display="inline-block">
                            <MdNotifications size={22} />
                            {unreadCount > 0 && (
                                <Badge
                                    colorScheme="red"
                                    borderRadius="full"
                                    position="absolute"
                                    top="-6px"
                                    right="-6px"
                                    fontSize="9px"
                                    minW="16px"
                                    textAlign="center"
                                >
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                </Badge>
                            )}
                        </Box>
                    </Link>
                    <Link to="/bookmarks">
                        <BsBookmarkFill size={18} />
                    </Link>
                    <Link to="/settings">
                        <MdOutlineSettings size={20} />
                    </Link>
                    <Button size={"xs"} onClick={logout}>
                        <FiLogOut size={20} />
                    </Button>
                </Flex>
            )}

            {!user && (
                <Link to="/auth" onClick={() => setAuthScreen("signup")}>
                    Sign up
                </Link>
            )}
        </Flex>
    );
};

export default Header;
