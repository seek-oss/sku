import { Link, type LinkProps } from 'react-router';
import { usePreloadRoute } from 'sku/ssr';

/**
 * On hover / focus / touch, warms lazy route modules for the destination.
 */
export function PreloadingLink({
  to,
  onFocus,
  onMouseEnter,
  onTouchStart,
  ...rest
}: LinkProps) {
  const preload = usePreloadRoute(to);

  return (
    <Link
      to={to}
      onFocus={(event) => {
        preload();
        onFocus?.(event);
      }}
      onMouseEnter={(event) => {
        preload();
        onMouseEnter?.(event);
      }}
      onTouchStart={(event) => {
        preload();
        onTouchStart?.(event);
      }}
      {...rest}
    />
  );
}
