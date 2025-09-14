import React, { useState, useId, forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showPasswordToggle?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  className = "",
  id,
  showPasswordToggle,
  type,
  ...props
}, ref) => {
  const uniqueId = useId();
  const inputId = id || `input-${uniqueId}`;
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-900 mb-1"
        >
          {label}
        </label>
      )}
      {showPasswordToggle && (type === "password" || !type) ? (
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={passwordVisible ? "text" : "password"}
            className={`
              w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm pr-10
              bg-white text-gray-900 placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              disabled:bg-gray-50 disabled:text-gray-500
              ${error ? "border-red-500 focus:ring-red-500 focus:border-red-500" : ""}
              ${className}
            `}
            {...props}
          />
          <button
            type="button"
            aria-label={passwordVisible ? "Hide password" : "Show password"}
            onClick={() => setPasswordVisible((v) => !v)}
            className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
            tabIndex={-1}
          >
            {passwordVisible ? (
              // Eye off icon
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.6-1.36 1.5-2.62 2.57-3.68M22.94 11.06C21.27 7 17 4 12 4c-1.53 0-3 .29-4.35.82" />
                <path d="M1 1l22 22" />
                <path d="M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 2.12-.88" />
              </svg>
            ) : (
              // Eye icon
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
      ) : (
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={`
            w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
            bg-white text-gray-900 placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:bg-gray-50 disabled:text-gray-500
            ${error ? "border-red-500 focus:ring-red-500 focus:border-red-500" : ""}
            ${className}
          `}
          {...props}
        />
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-600">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = "Input";

export default Input;
