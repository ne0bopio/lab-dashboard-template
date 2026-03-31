"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function FileViewer({ content, filename }: { content: string; filename: string }) {
  const isMd = filename.endsWith(".md");

  if (!isMd) {
    return (
      <pre
        className="w-full h-full overflow-auto p-4 font-mono"
        style={{
          fontSize: "0.75rem",
          lineHeight: "1.6",
          color: "#e8eaed",
          background: "#080b0f",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {content}
      </pre>
    );
  }

  return (
    <div
      className="w-full h-full overflow-auto px-6 py-4 prose-invert"
      style={{ background: "#080b0f" }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="font-mono font-bold mb-3 mt-6" style={{ fontSize: "1.4rem", color: "#ffb347", borderBottom: "1px solid #1e2d3d", paddingBottom: "0.5rem" }}>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="font-mono font-bold mb-2 mt-5" style={{ fontSize: "1.1rem", color: "#00e5ff" }}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="font-mono font-semibold mb-2 mt-4" style={{ fontSize: "0.95rem", color: "#bf5fff" }}>
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="mb-3" style={{ fontSize: "0.82rem", lineHeight: "1.7", color: "#c8ccd0" }}>
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="mb-3 pl-5" style={{ listStyleType: "disc" }}>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 pl-5" style={{ listStyleType: "decimal" }}>
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="mb-1" style={{ fontSize: "0.82rem", lineHeight: "1.6", color: "#c8ccd0" }}>
              {children}
            </li>
          ),
          code: ({ className, children, ...props }) => {
            const isBlock = className?.includes("language-");
            if (isBlock) {
              return (
                <pre
                  className="rounded-md p-3 my-3 overflow-x-auto"
                  style={{ background: "#111820", border: "1px solid #1e2d3d" }}
                >
                  <code className="font-mono" style={{ fontSize: "0.72rem", color: "#00e5ff" }}>
                    {children}
                  </code>
                </pre>
              );
            }
            return (
              <code
                className="font-mono px-1 py-0.5 rounded"
                style={{ fontSize: "0.75rem", background: "#1a2332", color: "#ffb347" }}
                {...props}
              >
                {children}
              </code>
            );
          },
          blockquote: ({ children }) => (
            <blockquote
              className="my-3 pl-4"
              style={{ borderLeft: "3px solid #ffb347", color: "#8899aa" }}
            >
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3">
              <table className="w-full font-mono" style={{ fontSize: "0.72rem", borderCollapse: "collapse" }}>
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th
              className="text-left px-3 py-2 font-semibold"
              style={{ borderBottom: "1px solid #1e2d3d", color: "#ffb347", background: "#111820" }}
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td
              className="px-3 py-1.5"
              style={{ borderBottom: "1px solid #1e2d3d22", color: "#c8ccd0" }}
            >
              {children}
            </td>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#00e5ff", textDecoration: "underline", textUnderlineOffset: "2px" }}
            >
              {children}
            </a>
          ),
          hr: () => (
            <hr className="my-4" style={{ border: "none", borderTop: "1px solid #1e2d3d" }} />
          ),
          strong: ({ children }) => (
            <strong style={{ color: "#e8eaed", fontWeight: 600 }}>{children}</strong>
          ),
          em: ({ children }) => (
            <em style={{ color: "#8899aa" }}>{children}</em>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
