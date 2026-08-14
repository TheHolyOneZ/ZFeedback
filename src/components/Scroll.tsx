import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import "./Scroll.css";


const MIN_THUMB = 32;

const IDLE_MS = 900;

export function Scroll({
  className = "",
  children,

  onScroll,
}: {
  className?: string;
  children: ReactNode;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
}) {
  const view = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const idle = useRef<number | undefined>(undefined);

  const [metrics, setMetrics] = useState({ height: 0, top: 0, needed: false });
  const [active, setActive] = useState(false);
  const [dragging, setDragging] = useState(false);

  const measure = useCallback(() => {
    const el = view.current;
    const track = rail.current;
    if (!el || !track) return;

    const { scrollHeight, clientHeight, scrollTop } = el;
    const overflow = scrollHeight - clientHeight;


    if (overflow <= 1) {
      setMetrics((m) => (m.needed ? { ...m, needed: false } : m));
      return;
    }

    const railH = track.clientHeight;
    const height = Math.max(MIN_THUMB, (clientHeight / scrollHeight) * railH);
    const top = (scrollTop / overflow) * (railH - height);

    setMetrics({ height, top, needed: true });
  }, []);


  useLayoutEffect(measure, [measure, children]);

  useEffect(() => {
    const el = view.current;
    if (!el) return;


    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);

    const mo = new MutationObserver(measure);
    mo.observe(el, { childList: true, subtree: true });

    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  useEffect(() => () => window.clearTimeout(idle.current), []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    measure();
    setActive(true);
    window.clearTimeout(idle.current);
    idle.current = window.setTimeout(() => setActive(false), IDLE_MS);
    onScroll?.(e);
  };


  const onThumbDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = view.current;
    const track = rail.current;
    if (!el || !track) return;

    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(true);

    const startY = e.clientY;
    const startTop = el.scrollTop;
    const railH = track.clientHeight;
    const overflow = el.scrollHeight - el.clientHeight;
    const range = railH - metrics.height;

    const move = (ev: PointerEvent) => {
      if (range <= 0) return;


      el.scrollTop = startTop + ((ev.clientY - startY) / range) * overflow;
    };
    const up = (ev: PointerEvent) => {
      setDragging(false);
      (e.target as HTMLElement).releasePointerCapture?.(ev.pointerId);
      (e.target as HTMLElement).removeEventListener("pointermove", move);
      (e.target as HTMLElement).removeEventListener("pointerup", up);
      (e.target as HTMLElement).removeEventListener("pointercancel", up);
    };
    (e.target as HTMLElement).addEventListener("pointermove", move);
    (e.target as HTMLElement).addEventListener("pointerup", up);
    (e.target as HTMLElement).addEventListener("pointercancel", up);
  };


  const onRailDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = view.current;
    const track = rail.current;
    if (!el || !track) return;
    const y = e.clientY - track.getBoundingClientRect().top;
    const dir = y < metrics.top ? -1 : 1;
    el.scrollBy({ top: dir * el.clientHeight * 0.9, behavior: "smooth" });
  };

  const show = metrics.needed && (active || dragging);

  return (
    <div className={`scr-host ${className}`.trim()}>
      <div ref={view} className="scr-view" onScroll={handleScroll}>
        {children}
      </div>

      <div
        ref={rail}
        className="scr-rail"
        data-needed={metrics.needed ? "true" : "false"}
        data-show={show ? "true" : "false"}
        onPointerEnter={() => setActive(true)}
        onPointerLeave={() => !dragging && setActive(false)}
        onPointerDown={onRailDown}
        aria-hidden="true"
      >
        {metrics.needed && (
          <div
            className="scr-thumb"
            data-dragging={dragging ? "true" : "false"}
            style={{
              height: `${metrics.height}px`,
              transform: `translateY(${metrics.top}px)`,
            }}
            onPointerDown={onThumbDown}
          />
        )}
      </div>
    </div>
  );
}
