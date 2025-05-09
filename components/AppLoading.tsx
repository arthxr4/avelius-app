import Image from "next/image"

interface AppLoadingProps {
  id?: string
}

export default function AppLoading({ id }: AppLoadingProps) {
  return (
    <div id={id} className="flex h-screen flex-col items-center justify-center gap-0">
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