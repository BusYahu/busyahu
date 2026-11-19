export function createVerificationCountdown(
  isActive: () => boolean,
  initialSeconds = 600,
) {
  let seconds = $state(initialSeconds);

  $effect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (isActive() && seconds > 0) {
      timer = setInterval(() => {
        seconds = seconds > 0 ? seconds - 1 : 0;
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  });

  return {
    get seconds() {
      return seconds;
    },
    reset() {
      seconds = initialSeconds;
    },
  };
}
