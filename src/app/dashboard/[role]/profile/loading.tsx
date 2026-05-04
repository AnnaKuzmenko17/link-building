import { Fragment } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ProfileLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-9 w-28" />
      </div>

      <div className="flex items-center gap-4">
        <Skeleton className="size-20 rounded-full" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-3 text-sm">
            {Array.from({ length: 4 }).map((_, i) => (
              <Fragment key={i}>
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
              </Fragment>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
