import type { MDXComponents } from 'mdx/types';
import Link from 'next/link';

// Required by @next/mdx. Internal links use next/link; external ones open in a new tab.
const components: MDXComponents = {
  a: ({ href = '', children, ...props }) =>
    href.startsWith('/') ? (
      <Link href={href} {...props}>
        {children}
      </Link>
    ) : (
      <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    ),
  table: (props) => (
    <div className="overflow-x-auto">
      <table {...props} />
    </div>
  ),
};

export function useMDXComponents(): MDXComponents {
  return components;
}
