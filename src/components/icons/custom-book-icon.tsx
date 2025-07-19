import type { SVGProps } from "react";

export const CustomBookIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    // PASTE YOUR SVG CODE HERE
    // Example: <svg>...</svg>
    // Make sure to forward the props, e.g. <svg {...props}>
    // You can also adjust the default size here.
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
};
