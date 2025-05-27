import { CSSProperties } from "react";

import { useEffect } from "react";

import { useRef } from "react";

export const AnimatedGradientBorderTW: React.FC<{
  children: React.ReactNode;
  animate?: boolean;
}> = ({ children, animate = true }) => {
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const boxElement = boxRef.current;
    if (!boxElement) return;

    if (!animate) {
      boxElement.style.setProperty("--angle", "0deg");
      return;
    }

    const updateAnimation = () => {
      let angle =
        parseFloat(boxElement.style.getPropertyValue("--angle")) + 0.2;
      if (angle >= 360) angle -= 360;
      boxElement.style.setProperty("--angle", `${angle}deg`);
      requestAnimationFrame(updateAnimation);
    };

    requestAnimationFrame(updateAnimation);
  }, [animate]);

  if (!animate) {
    return children;
  }

  return (
    <div
      ref={boxRef}
      style={
        {
          "--angle": "0deg",
          "--border-color": "linear-gradient(var(--angle), #8838ff, #f8f9fa)",
          "--bg-color": "linear-gradient(#fff, #fff)",
        } as CSSProperties
      }
      className="rounded-xs flex items-center justify-center border-2 border-[#0000] 
      [background:padding-box_var(--bg-color),border-box_var(--border-color)]
      w-full h-fit mt-4
      "
    >
      {children}
    </div>
  );
};
