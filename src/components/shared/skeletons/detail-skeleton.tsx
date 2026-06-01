// Copyright 2025 GriffinGuard
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export function DetailSkeleton({ fieldRows = 5 }: { fieldRows?: number }) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Card>
        <CardContent className="space-y-4 p-4">
          {Array.from({ length: fieldRows }).map((_, index) => (
            <div key={index} className="rounded-2xl border px-4 py-3">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="mt-1.5 h-4 w-36" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
