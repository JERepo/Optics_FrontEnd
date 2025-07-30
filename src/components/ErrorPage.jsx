import { useNavigate } from "react-router-dom";

const ErrorPage = ({ error, errorInfo, onReset }) => {
  const navigate = useNavigate();

  return (
    <div className="  to-gray-100 flex items-center justify-center align-middle pt-10 ">
      <div className=" space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
            <svg
              className="h-10 w-10 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="mt-6 text-3xl font-extrabold text-gray-900">
            Oops! Something went wrong
          </h1>
          <p className="mt-3 text-lg text-gray-600">
            We apologize for the inconvenience. Here's what you can do next:
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-6 shadow-xl rounded-xl">
          <div className="space-y-4">
            <button
              onClick={() => navigate("/")}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <svg
                  className="h-5 w-5 text-indigo-300 group-hover:text-indigo-200"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
              </span>
              Go to Homepage
            </button>

            <button
              onClick={onReset}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors duration-200"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <svg
                  className="h-5 w-5 text-emerald-300 group-hover:text-emerald-200"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </span>
              Try Again
            </button>
          </div>

          {import.meta.env.MODE === "development" && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <details className="group">
                <summary className="flex justify-between items-center cursor-pointer text-gray-700 hover:text-gray-900">
                  <span className="text-sm font-medium">Error Details</span>
                  <svg
                    className="h-5 w-5 text-gray-400 group-open:rotate-180 transform transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </summary>
                <div className="mt-3 bg-gray-50 p-4 rounded-lg">
                  <p className="text-red-600 font-mono text-sm break-words">
                    {error?.toString()}
                  </p>
                  <pre className="mt-3 p-3 bg-gray-100 rounded text-xs text-gray-700 overflow-x-auto">
                    {errorInfo?.componentStack}
                  </pre>
                </div>
              </details>
            </div>
          )}
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>
            Need help?{" "}
            <a
              href="mailto:support@example.com"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Contact our support team
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
