import { useState, useCallback } from "react";
import useShowToast from "./useShowToast";

const usePreviewImg = ({ maxSize = 5 * 1024 * 1024 } = {}) => {
    const [imgUrl, setImgUrl] = useState(null);
    const showToast = useShowToast();

    const handleImageChange = useCallback(
        (e) => {
            const file = e?.target?.files?.[0] || null;
            if (!file) return;

            if (!file.type?.startsWith("image/")) {
                showToast("Invalid file type", "Please select an image file", "error");
                setImgUrl(null);
                return;
            }

            if (file.size > maxSize) {
                const mb = (maxSize / 1024 / 1024).toFixed(1);
                showToast("File too large", `Please select an image smaller than ${mb} MB`, "error");
                setImgUrl(null);
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setImgUrl(reader.result);
            };
            reader.readAsDataURL(file);
        },
        [maxSize, showToast]
    );

    return { imgUrl, setImgUrl, handleImageChange };
};

export default usePreviewImg;
