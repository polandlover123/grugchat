import type { SVGProps } from "react";

export const CustomWelcomeIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    // PASTE YOUR SVG CODE HERE
    // Example: <svg>...</svg>
    // Make sure to forward the props, e.g. <svg {...props}>
    // You can also adjust the default size here.
    <svg
      data-ai-hint="document analysis"
      width="100"
      height="100"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20ZM8 12H16V14H8V12ZM8 16H13V18H8V16Z"
        fill="currentColor"
      />
    </svg>
  );
};
