// src/components/icons/custom-icon.tsx
import type { SVGProps } from "react";

/**
 * A placeholder for a custom SVG icon.
 *
 * How to use:
 * 1. Paste your SVG code inside the `return (...)` statement.
 * 2. Ensure the <svg> tag includes `{...props}`. This allows you to pass in `className`, etc.
 * 3. Convert any hyphenated attributes to camelCase (e.g., `stroke-width` becomes `strokeWidth`).
 * 4. Replace any hardcoded width and height with "1em" to make the icon scale with text size, or remove them to let CSS control the size.
 */
export const CustomIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    // PASTE YOUR SVG CODE HERE, REPLACING THIS COMMENT AND THE EXAMPLE <svg> TAG
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props} // This is important!
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
};
