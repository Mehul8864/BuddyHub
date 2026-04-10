import { Box, Container } from "@chakra-ui/react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import UserPage from "./screens/UserPage";
import PostPage from "./screens/PostPage";
import Header from "./components/Header";
import HomePage from "./screens/HomePage";
import AuthPage from "./screens/AuthPage";
import { useRecoilValue } from "recoil";
import userAtom from "./atoms/userAtom";
import UpdateProfilePage from "./screens/UpdateProfilePage";
import CreatePost from "./components/CreatePost";
import ChatPage from "./screens/ChatPage";
import SettingsPage from "./screens/SettingsPage";
import NotificationsPage from "./screens/NotificationsPage";
import BookmarksPage from "./screens/BookmarksPage";
import SearchPage from "./screens/SearchPage";
function App() {
    const user = useRecoilValue(userAtom);
    const { pathname } = useLocation();
    return (
        <Box position={"relative"} w="full">
            <Container
                maxW={
                    pathname === "/" ? { base: "620px", md: "900px" } : "620px"
                }
            >
                <Header />
                <Routes>
                    <Route
                        path="/"
                        element={user ? <HomePage /> : <Navigate to="/auth" />}
                    />
                    <Route
                        path="/auth"
                        element={!user ? <AuthPage /> : <Navigate to="/" />}
                    />
                    <Route
                        path="/update"
                        element={
                            user ? (
                                <UpdateProfilePage />
                            ) : (
                                <Navigate to="/auth" />
                            )
                        }
                    />

                    <Route
                        path="/:username"
                        element={
                            user ? (
                                <>
                                    <UserPage />
                                    <CreatePost />
                                </>
                            ) : (
                                <UserPage />
                            )
                        }
                    />
                    <Route path="/:username/post/:pid" element={<PostPage />} />
                    <Route
                        path="/chat"
                        element={
                            user ? <ChatPage /> : <Navigate to={"/auth"} />
                        }
                    />
                    <Route
                        path="/settings"
                        element={
                            user ? <SettingsPage /> : <Navigate to={"/auth"} />
                        }
                    />
                    <Route
                        path="/notifications"
                        element={user ? <NotificationsPage /> : <Navigate to={"/auth"} />}
                    />
                    <Route
                        path="/bookmarks"
                        element={user ? <BookmarksPage /> : <Navigate to={"/auth"} />}
                    />
                    <Route
                        path="/search"
                        element={user ? <SearchPage /> : <Navigate to={"/auth"} />}
                    />
                </Routes>
            </Container>
        </Box>
    );
}

export default App;