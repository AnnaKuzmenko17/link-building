interface Props {
  message: string
}

export function EmptyState({ message }: Props) {
  return (
    <div className="flex items-center justify-center py-12">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
