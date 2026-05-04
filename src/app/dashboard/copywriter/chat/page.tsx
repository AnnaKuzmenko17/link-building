import { MessageCircleIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function ChatPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Chat</h1>
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <MessageCircleIcon className="h-10 w-10 text-muted-foreground" />
          <p className="text-lg font-medium">Coming soon</p>
          <p className="text-sm text-muted-foreground">The chat feature is currently under development.</p>
        </CardContent>
      </Card>
    </div>
  )
}
