import { useEffect } from "react";
import { useRouter } from "next/router";
import { Flex, Spinner } from "@chakra-ui/react";
import { useRecoilValue } from "recoil";
import hydratedAtom from "../atoms/hydratedAtom";
import userAtom from "../atoms/userAtom";
import SettingsPage from "../screens/SettingsPage";

export default function SettingsRoutePage() {
  const router = useRouter();
  const hydrated = useRecoilValue(hydratedAtom);
  const user = useRecoilValue(userAtom);

  useEffect(() => {
    if (hydrated && !user) router.replace("/auth");
  }, [hydrated, user, router]);

  if (!hydrated) {
    return (
      <Flex justifyContent="center" py={10}>
        <Spinner size="xl" />
      </Flex>
    );
  }

  return user ? <SettingsPage /> : null;
}