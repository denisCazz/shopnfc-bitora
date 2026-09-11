"use client";

import Image from "next/image";

export default function FlameEffect() {
  return (
    <Image
      src="/bitora.png"
      alt="Bitora"
      width={56}
      height={56}
      className="h-14 w-14 rounded-full object-cover"
      priority
    />
  );
}
