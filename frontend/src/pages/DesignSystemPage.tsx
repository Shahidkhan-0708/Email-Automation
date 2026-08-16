import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { PageHeader } from './shared'

export const DesignSystemPage: React.FC = () => (
  <div className="space-y-6">
    <PageHeader title="Design Tokens & Components" description="Semantic colors, badges and controls used across the app. Everything is shadcn/ui on Radix primitives." />

    <div className="grid gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Status Badges</CardTitle>
          <CardDescription>Semantic states across the pipeline</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant="neutral">Ready</Badge>
          <Badge variant="info">Claimed</Badge>
          <Badge variant="info">Sending</Badge>
          <Badge variant="success">Sent</Badge>
          <Badge variant="success">Delivered</Badge>
          <Badge variant="warning">Follow-up 1</Badge>
          <Badge variant="ai">Replied</Badge>
          <Badge variant="destructive">Bounced</Badge>
          <Badge variant="destructive">Rejected</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Buttons</CardTitle>
          <CardDescription>Primary, secondary and outline actions</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button size="sm">Small</Button>
          <Button size="sm" variant="secondary">Small 2</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Brand Colors</CardTitle>
          <CardDescription>HSL tokens defined in index.css (both themes)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            { name: 'primary', cls: 'bg-primary' },
            { name: 'accent', cls: 'bg-accent' },
            { name: 'success', cls: 'bg-success' },
            { name: 'warning', cls: 'bg-warning' },
            { name: 'destructive', cls: 'bg-destructive' },
            { name: 'info', cls: 'bg-info' },
          ].map(c => (
            <div key={c.name} className="flex items-center gap-3">
              <div className={`h-6 w-6 rounded ${c.cls}`} />
              <span className="font-mono text-xs text-muted-foreground">{c.name}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Form Controls</CardTitle>
          <CardDescription>Select, switch, checkbox and labeled inputs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ds-select">Campaign</Label>
            <Select defaultValue="v1">
              <SelectTrigger id="ds-select" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="v1">V1 College Outreach</SelectItem>
                <SelectItem value="v2">V2 Faculty Research</SelectItem>
                <SelectItem value="v3">V3 Departmental</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ds-input">Search</Label>
            <Input id="ds-input" placeholder="Search contacts…" />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2.5">
            <Label htmlFor="ds-switch">Send automatically</Label>
            <Switch id="ds-switch" defaultChecked />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="ds-check" defaultChecked />
            <Label htmlFor="ds-check" className="font-normal text-muted-foreground">Include follow-up sequence</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Menus & Avatars</CardTitle>
          <CardDescription>Dropdown menus and identity elements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Open menu</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              <DropdownMenuLabel>Quick actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Run outreach batch</DropdownMenuItem>
              <DropdownMenuItem>Check replies</DropdownMenuItem>
              <DropdownMenuItem>Sync Airtable</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">Stop all sends</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src="" alt="AI" />
              <AvatarFallback className="bg-gradient-to-r from-primary to-accent text-white">AI</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarImage src="" alt="SR" />
              <AvatarFallback className="bg-muted text-muted-foreground">SR</AvatarFallback>
            </Avatar>
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="ghost">Hover me</Button>
                </TooltipTrigger>
                <TooltipContent>Tooltip on Radix</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Skeleton Loading</CardTitle>
          <CardDescription>Shown while data is fetching</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
)
