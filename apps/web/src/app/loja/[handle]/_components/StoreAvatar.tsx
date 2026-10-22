import Image from 'next/image';
import { cn } from '@/lib/utils';

/** Store logo, or its initial on the accent color when there is no logo. */
export function StoreAvatar({
  name,
  logoUrl,
  size,
  className,
}: {
  name: string;
  logoUrl: string | null;
  size: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-store-soft font-display font-bold text-store',
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={`Logo da loja ${name}`}
          fill
          sizes={`${size}px`}
          className="object-cover"
        />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </div>
  );
}
