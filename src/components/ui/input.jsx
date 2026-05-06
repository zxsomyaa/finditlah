import * as React from "react";

const Input = React.forwardRef(
  /**
   * @param {{
   *  className?: string;
   *  type?: string;
   *  [key: string]: any;
   * }} props
   */
  ({ className = "", type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        {...props}
        className={
          "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm " +
          "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 " +
          className
        }
      />
    );
  }
);

Input.displayName = "Input";

export { Input };