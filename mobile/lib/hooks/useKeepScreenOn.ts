import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useEffect, useRef } from 'react';

const TAG = 'recipe-detail';

export function useKeepScreenOn(isEnabled: boolean) {
  const wasActivated = useRef(false);

  useEffect(() => {
    if (isEnabled) {
      activateKeepAwakeAsync(TAG);
      wasActivated.current = true;
    } else if (wasActivated.current) {
      deactivateKeepAwake(TAG);
      wasActivated.current = false;
    }
    return () => {
      if (wasActivated.current) {
        deactivateKeepAwake(TAG);
        wasActivated.current = false;
      }
    };
  }, [isEnabled]);
}
