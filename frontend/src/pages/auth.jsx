import { useEffect } from "react";
import { useRouter } from "next/router";
import { Flex, Spinner } from "@chakra-ui/react";
import { useRecoilValue } from "recoil";
import hydratedAtom from "../atoms/hydratedAtom";
import userAtom from "../atoms/userAtom";
import AuthPage from "../screens/AuthPage";

export default function AuthRoutePage() {
  const router = useRouter();
  const hydrated = useRecoilValue(hydratedAtom);
  const user = useRecoilValue(userAtom);

  useEffect(() => {
    if (hydrated && user) router.replace("/");
  }, [hydrated, user, router]);

  if (!hydrated) {
    return (
      <Flex justifyContent="center" py={10}>
        <Spinner size="xl" />
      </Flex>
    );
  }

  return !user ? <AuthPage /> : null;
}