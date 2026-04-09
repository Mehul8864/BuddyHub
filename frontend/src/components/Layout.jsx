import { Box, Container } from "@chakra-ui/react";
import { useRouter } from "next/router";
import Header from "./Header";

const Layout = ({ children }) => {
  const { pathname } = useRouter();

  return (
    <Box position={"relative"} w="full">
      <Container maxW={pathname === "/" ? { base: "620px", md: "900px" } : "620px"}>
        <Header />
        {children}
      </Container>
    </Box>
  );
};

export default Layout;