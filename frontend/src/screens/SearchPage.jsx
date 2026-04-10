import {
    Avatar,
    Box,
    Flex,
    Input,
    InputGroup,
    InputLeftElement,
    Spinner,
    Text,
    useColorModeValue,
} from "@chakra-ui/react";
import { useState, useCallback } from "react";
import { SearchIcon } from "@chakra-ui/icons";
import { Link } from "react-router-dom";
import useShowToast from "../hooks/useShowToast";
import useFollowUnfollow from "../hooks/useFollowUnfollow";
import { Button } from "@chakra-ui/react";

const SearchResult = ({ user }) => {
    const { handleFollowUnfollow, following, updating } = useFollowUnfollow(user);
    const hoverBg = useColorModeValue("gray.50", "gray.700");

    return (
        <Flex
            align="center"
            justify="space-between"
            p={3}
            borderRadius="md"
            _hover={{ bg: hoverBg }}
        >
            <Link to={`/${user.username}`} style={{ textDecoration: "none", flex: 1 }}>
                <Flex align="center" gap={3}>
                    <Avatar src={user.profilePic} size="md" name={user.username} />
                    <Box>
                        <Text fontWeight="bold" fontSize="sm">{user.username}</Text>
                        <Text fontSize="xs" color="gray.500">{user.name}</Text>
                        {user.bio && (
                            <Text fontSize="xs" color="gray.400" noOfLines={1}>{user.bio}</Text>
                        )}
                    </Box>
                </Flex>
            </Link>
            <Button
                size="sm"
                colorScheme={following ? "gray" : "blue"}
                variant={following ? "outline" : "solid"}
                onClick={handleFollowUnfollow}
                isLoading={updating}
                ml={3}
            >
                {following ? "Unfollow" : "Follow"}
            </Button>
        </Flex>
    );
};

const SearchPage = () => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const showToast = useShowToast();
    const bg = useColorModeValue("white", "gray.dark");

    const handleSearch = useCallback(async (value) => {
        const q = value ?? query;
        if (!q.trim()) { setResults([]); setSearched(false); return; }
        setLoading(true);
        setSearched(true);
        try {
            const res = await fetch(`/api/users/search?q=${encodeURIComponent(q.trim())}`);
            const data = await res.json();
            if (data.error) { showToast("Error", data.error, "error"); return; }
            setResults(Array.isArray(data) ? data : []);
        } catch (err) {
            showToast("Error", err.message, "error");
        } finally {
            setLoading(false);
        }
    }, [query, showToast]);

    const handleChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        if (!val.trim()) { setResults([]); setSearched(false); return; }
        // debounce
        clearTimeout(window._searchTimeout);
        window._searchTimeout = setTimeout(() => handleSearch(val), 400);
    };

    return (
        <Box maxW="600px" mx="auto" py={4}>
            <Text fontSize="xl" fontWeight="bold" mb={4}>Search People</Text>
            <InputGroup mb={4}>
                <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input
                    placeholder="Search by username or name..."
                    value={query}
                    onChange={handleChange}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    bg={bg}
                />
            </InputGroup>

            {loading && <Flex justify="center" py={6}><Spinner /></Flex>}

            {!loading && searched && results.length === 0 && (
                <Flex justify="center" py={8} direction="column" align="center" gap={2}>
                    <Text fontSize="2xl">🔍</Text>
                    <Text color="gray.500">No users found for "{query}"</Text>
                </Flex>
            )}

            <Flex direction="column" gap={1}>
                {results.map((user) => (
                    <SearchResult key={user._id} user={user} />
                ))}
            </Flex>
        </Box>
    );
};

export default SearchPage;
