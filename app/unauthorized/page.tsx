import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import Link from "next/link"

export default function UnauthorizedPage() {
  return (
    <div className="bg-muted flex h-[100vh] w-full items-center justify-center p-4">
      <Card className="w-full max-w-3xl shadow-none border-none p-10">
        <CardHeader className="text-left px-0 py-2">
          <div className="text-6xl font-bold leading-none">403</div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-left px-0 py-2">
          <h1 className="text-emphasis text-2xl font-medium">
            Vous n'avez pas accès à cette page
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm">
            Pour voir ou interagir avec cette page, vous devez avoir des privilèges d'administrateur ou de propriétaire
          </p>
        </CardContent>
        <CardFooter className="flex justify-left px-0 py-2">
          <Button asChild>
            <Link href="/">Retour à la page d'accueil</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 