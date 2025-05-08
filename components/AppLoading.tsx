import Image from "next/image"

export default function AppLoading() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-0">
      <div className="relative h-40 w-40">
        <Image
          src="/logo.svg"
          alt="Avelius Logo"
          fill
          className="object-contain"
          priority
        />
      </div>
      <div className="w-64">
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div className="h-full w-full animate-progress rounded-full bg-primary" />
        </div>
      </div>
    </div>
  )
} 