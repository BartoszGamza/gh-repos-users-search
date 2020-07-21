import { useEffect, useState, RefObject } from 'react';

const useKey = function (tagret: string, ref: RefObject<HTMLInputElement>, callback: () => void = () => {}) {
  const [keyPressed, setKeyPressed] = useState(false);

  function downHandler({ key }: { key: string }) {
    if (key === tagret) {
      setKeyPressed(true);
      // hacky workaround for opening tab
      if (callback) {
        callback();
        setKeyPressed(false);
      }
    }
  }

  const upHandler = ({ key }: { key: string }) => {
    if (key === tagret) {
      setKeyPressed(false);
    }
  };

  useEffect(() => {
    const refered = ref.current;
    refered?.addEventListener('keydown', downHandler);
    refered?.addEventListener('keyup', upHandler);

    return () => {
      refered?.removeEventListener('keydown', downHandler);
      refered?.removeEventListener('keyup', upHandler);
    };
  });

  return keyPressed;
};

export default useKey;
