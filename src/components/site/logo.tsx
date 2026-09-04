import Image from "next/image";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center ${className}`}>
      <Image
        src="/logo.png"
        alt="QRI — Quest Response Intelligence"
        width={76}
        height={40}
        priority
      />
    </span>
  );
}