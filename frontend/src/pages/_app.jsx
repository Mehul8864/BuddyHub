import React, { useEffect, useState } from "react";
import { ChakraProvider, Spinner, Flex } from "@chakra-ui/react";
import { mode } from "@chakra-ui/theme-tools";
import { extendTheme } from "@chakra-ui/theme-utils";
import { ColorModeScript } from "@chakra-ui/color-mode";
import { RecoilRoot, useSetRecoilState } from "recoil";
import { SocketContextProvider } from "../context/SocketContext";
import Layout from "../components/Layout";
import userAtom from "../atoms/userAtom";
import hydratedAtom from "../atoms/hydratedAtom";
import "../index.css";

const styles = {
  global: (props) => ({
    body: {
      color: mode("gray.800", "whiteAlpha.900")(props),
      bg: mode("gray.100", "#101010")(props),
    },
  }),
};

const config = {
  initialColorMode: "dark",
  useSystemColorMode: true,
};

const colors = {
  gray: {
    light: "#616161",
    dark: "#1e1e1e",
  },
};

const theme = extendTheme({ config, styles, colors });

function HydrationGate({ children }) {
  const setUser = useSetRecoilState(userAtom);
  const setHydrated = useSetRecoilState(hydratedAtom);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user-threads");
      if (stored) setUser(JSON.parse(stored));
    } catch {
      localStorage.removeItem("user-threads");
    } finally {
      setHydrated(true);
      setReady(true);
    }
  }, [setHydrated, setUser]);

  if (!ready) {
    return (
      <Flex minH="100vh" align="center" justify="center">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return children;
}

export default function App({ Component, pageProps }) {
  return (
    <React.StrictMode>
      <RecoilRoot>
        <ChakraProvider theme={theme}>
          <ColorModeScript initialColorMode={theme.config.initialColorMode} />
          <SocketContextProvider>
            <HydrationGate>
              <Layout>
                <Component {...pageProps} />
              </Layout>
            </HydrationGate>
          </SocketContextProvider>
        </ChakraProvider>
      </RecoilRoot>
    </React.StrictMode>
  );
}