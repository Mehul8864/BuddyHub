import { atom } from "recoil";

const hydratedAtom = atom({
  key: "hydratedAtom",
  default: false,
});

export default hydratedAtom;