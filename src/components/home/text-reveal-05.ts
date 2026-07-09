import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText, ScrollTrigger);

type TextReveal05Options = {
  ignoreManual?: boolean;
};

type TextReveal05Cleanup = () => void;

function shuffleArray<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function textReveal05(
  scope: Element | Document = document,
  delay = 0,
  { ignoreManual = false }: TextReveal05Options = {},
): TextReveal05Cleanup {
  const CONFIG = {
    duration: 0.6,
    shuffles: 8,
    scrollStart: "top 85%",
    scrubStart: "top 90%",
    scrubEnd: "top 50%",
    once: false,
    markers: false,
  };
  const splitInstances: SplitText[] = [];
  const tweens = new Set<gsap.core.Tween>();
  const allEls = scope.querySelectorAll<HTMLElement>("[data-reveal-05]");
  const autoEls = ignoreManual ? [...allEls] : [...allEls].filter((el) => !el.hasAttribute("data-manual"));
  gsap.set(autoEls, { visibility: "visible" });
  allEls.forEach((el) => {
    if (!ignoreManual && el.hasAttribute("data-manual")) {
      const split = SplitText.create(el, {
        type: "chars, words",
        charsClass: "char",
        wordsClass: "word",
        autoSplit: true,
      });
      splitInstances.push(split);
      return;
    }
    const scrollMode = el.getAttribute("data-scroll");
    const useScroll = el.hasAttribute("data-scroll");
    const useScrub = scrollMode === "scrub";
    const split = SplitText.create(el, {
      type: "chars, words",
      charsClass: "char",
      wordsClass: "word",
      autoSplit: true,
      onSplit(instance) {
        const durationVal = parseFloat(el.dataset.duration ?? "");
        const delayVal = parseFloat(el.dataset.delay ?? "");
        const shufflesVal = parseInt(el.dataset.shuffles ?? "", 10);
        const duration = Number.isNaN(durationVal) ? CONFIG.duration : durationVal;
        const elDelay = Number.isNaN(delayVal) ? 0 : delayVal;
        const shuffles = Number.isNaN(shufflesVal) ? CONFIG.shuffles : shufflesVal;
        const once = el.hasAttribute("data-once") ? el.getAttribute("data-once") !== "false" : CONFIG.once;
        const totalSteps = shuffles + 1;
        const wordData = instance.words.map((wordEl) => {
          const charEls = [...wordEl.querySelectorAll(".char")];
          const originals = charEls.map((c) => c.textContent);
          const states = [];
          for (let s = 0; s < shuffles; s++) {
            states.push(shuffleArray([...originals]));
          }
          states.push([...originals]);
          return { charEls, states };
        });
        wordData.forEach(({ charEls, states }) => {
          charEls.forEach((c, i) => (c.textContent = states[0][i]));
        });
        const proxy = { progress: 0 };
        let lastStep = 0;
        function applyStep(step: number) {
          if (step === lastStep) return;
          lastStep = step;
          wordData.forEach(({ charEls, states }) => {
            charEls.forEach((c, i) => (c.textContent = states[step][i]));
          });
        }
        const tweenVars: gsap.TweenVars = {
          progress: 1,
          duration,
          ease: "none",
          delay: useScroll ? elDelay : elDelay + delay,
          onUpdate() {
            applyStep(Math.min(Math.floor(proxy.progress * totalSteps), totalSteps - 1));
          },
          onComplete() {
            applyStep(totalSteps - 1);
          },
        };
        if (useScrub) {
          tweenVars.scrollTrigger = {
            trigger: el,
            start: CONFIG.scrubStart,
            end: CONFIG.scrubEnd,
            scrub: true,
            markers: CONFIG.markers,
            ...(once && { onLeave: (self) => self.kill(false) }),
          };
        } else if (useScroll) {
          const start = scrollMode || CONFIG.scrollStart;
          tweenVars.scrollTrigger = {
            trigger: el,
            start: `clamp(${start})`,
            markers: CONFIG.markers,
            ...(once ? { once: true } : { toggleActions: "play none none reverse" }),
          };
        }
        const tween = gsap.to(proxy, tweenVars);
        tweens.add(tween);
        return tween;
      },
    });
    splitInstances.push(split);
  });

  ScrollTrigger.refresh();

  return () => {
    tweens.forEach((tween) => {
      tween.scrollTrigger?.kill();
      tween.kill();
    });
    splitInstances.forEach((split) => {
      split.revert();
      split.kill();
    });
    ScrollTrigger.refresh();
  };
}
