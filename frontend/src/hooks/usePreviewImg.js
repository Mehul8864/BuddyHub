import { useState, useEffect, useRef, useCallback } from "react";
import useShowToast from "./useShowToast";

/**
 * usePreviewImg
 * @param {Object} options
 * @param {number} options.maxSize maximum allowed file size in bytes (default 5MB)
 * @param {string} options.accept value for the file input accept attribute (default "image/*")
 */
const usePreviewImg = ({ maxSize = 5 * 1024 * 1024, accept = "image/*" } = {}) => {
  const [imgUrl, setImgUrl] = useState(null);
  const prevUrlRef = useRef(null);
  const showToast = useShowToast();

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current);
        prevUrlRef.current = null;
      }
    };
  }, []);

  const revokePrev = useCallback(() => {
    if (prevUrlRef.current) {
      URL.revokeObjectURL(prevUrlRef.current);
      prevUrlRef.current = null;
    }
  }, []);

  const handleFile = useCallback(
    (file) => {
      if (!file) {
        revokePrev();
        setImgUrl(null);
        return;
      }

      if (!file.type || !file.type.startsWith("image/")) {
        showToast("Invalid file type", "Please select an image file", "error");
        revokePrev();
        setImgUrl(null);
        return;
      }

      if (file.size > maxSize) {
        const mb = Math.round((maxSize / 1024 / 1024) * 10) / 10;
        showToast("File too large", `Please select an image smaller than ${mb} MB`, "error");
        revokePrev();
        setImgUrl(null);
        return;
      }

      // create object url and cleanup previous one
      const url = URL.createObjectURL(file);
      revokePrev();
      prevUrlRef.current = url;
      setImgUrl(url);
    },
    [maxSize, revokePrev, showToast]
  );

  // accepts an input change event or nothing
  const handleImageChange = useCallback(
    (e) => {
      const file = e?.target?.files?.[0] ?? null;
      handleFile(file);
    },
    [handleFile]
  );

  const clear = useCallback(() => {
    revokePrev();
    setImgUrl(null);
  }, [revokePrev]);

  return { imgUrl, handleImageChange, handleFile, clear, accept };
};

export default usePreviewImg;