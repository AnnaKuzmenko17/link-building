interface Props {
  message: string;
}

export function EmptyState({ message }: Props) {
  return (
    <div role="status" className="flex items-center justify-center py-12">
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}
