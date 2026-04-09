import { useRecoilValue } from "recoil";
import userAtom from "../../atoms/userAtom";
import UserPage from "../../screens/UserPage";
import CreatePost from "../../components/CreatePost";

export default function UsernamePage() {
  const user = useRecoilValue(userAtom);

  return (
    <>
      <UserPage />
      {user ? <CreatePost /> : null}
    </>
  );
}