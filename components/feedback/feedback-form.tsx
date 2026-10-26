'use client'

import { Card, Field, Input, Select, Textarea } from '@/components/shared/form-fields'
import { Button, buttonVariants } from '@/components/ui/button'
import { todayISO } from '@/lib/format'
import { StorageFullError, submitFeedback, useAppState } from '@/lib/store'
import { FEEDBACK_CATEGORIES, type FeedbackCategory } from '@/lib/types'
import { CheckCircle2, ImagePlus, Loader2, X } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { toast } from 'sonner'

const MAX_UPLOAD = 8 * 1024 * 1024

function resizeImage(file: File, max = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the image.'))
    reader.onload = () => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onerror = () => reject(new Error('This file is not a valid image.'))
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.72))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

type Errors = Partial<Record<'title' | 'category' | 'location' | 'description' | 'incidentDate' | 'photo', string>>

export function FeedbackForm() {
  const zones = useAppState((s) => s.zones)
  const locations = useMemo(() => Array.from(new Set(zones.map((z) => z.area))).sort(), [zones])
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<FeedbackCategory | ''>('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [incidentDate, setIncidentDate] = useState(todayISO())
  const [photo, setPhoto] = useState<string>()
  const [processing, setProcessing] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [submittedRef, setSubmittedRef] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErrors((x) => ({ ...x, photo: 'Please choose an image file (JPG or PNG).' }))
      return
    }
    if (file.size > MAX_UPLOAD) {
      setErrors((x) => ({ ...x, photo: 'Image must be smaller than 8 MB.' }))
      return
    }
    setProcessing(true)
    try {
      setPhoto(await resizeImage(file))
      setErrors((x) => ({ ...x, photo: undefined }))
    } catch (err) {
      setErrors((x) => ({ ...x, photo: (err as Error).message }))
    } finally {
      setProcessing(false)
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next: Errors = {}
    if (title.trim().length < 5) next.title = 'Please enter a short title (at least 5 characters).'
    if (!category) next.category = 'Please choose a category.'
    if (location.trim().length < 3) next.location = 'Please tell us where this happened.'
    if (description.trim().length < 20) next.description = 'Please describe the issue in at least 20 characters.'
    if (!incidentDate) next.incidentDate = 'Please choose a date.'
    else if (incidentDate > todayISO()) next.incidentDate = 'The date cannot be in the future.'
    setErrors(next)
    if (Object.keys(next).length) {
      toast.error('Please fix the highlighted fields.')
      return
    }
    try {
      const ref = submitFeedback({
        title: title.trim(),
        category: category as FeedbackCategory,
        location: location.trim(),
        description: description.trim(),
        incidentDate,
        photo,
      })
      setSubmittedRef(ref)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      toast.error(
        err instanceof StorageFullError
          ? 'Browser storage is full. Try removing the photo and submitting again.'
          : (err as Error).message,
      )
    }
  }

  if (submittedRef) {
    return (
      <Card className="flex flex-col items-center gap-4 p-8 text-center" role="status">
        <span className="flex size-12 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="size-6" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold text-foreground">Feedback submitted</h2>
          <p className="text-sm text-muted-foreground">Keep this reference number to track your submission.</p>
        </div>
        <p className="rounded-lg border border-dashed border-primary/40 bg-accent px-5 py-3 font-mono text-2xl font-bold tracking-wider text-primary">
          {submittedRef}
        </p>
        <p className="max-w-md text-sm text-muted-foreground">
          The project team will review your submission. You&apos;ll see a notification here when the status changes or
          a response is posted.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link href={`/feedback/${submittedRef}`} className={buttonVariants({ size: 'lg' })}>
            Track this submission
          </Link>
          <Link href="/feedback" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
            View all my feedback
          </Link>
        </div>
      </Card>
    )
  }

  const aria = (k: keyof Errors) => ({
    'aria-invalid': !!errors[k] || undefined,
    'aria-describedby': errors[k] ? `fb-${k}-error` : undefined,
  })

  return (
    <Card className="p-5 md:p-6">
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <Field id="fb-title" label="Title" required error={errors.title}>
          <Input
            id="fb-title"
            value={title}
            maxLength={120}
            placeholder="e.g. Blocked footpath near Komtar"
            onChange={(e) => setTitle(e.target.value)}
            {...aria('title')}
          />
        </Field>
        <div className="grid gap-5 md:grid-cols-2">
          <Field id="fb-category" label="Category" required error={errors.category}>
            <Select
              id="fb-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
              {...aria('category')}
            >
              <option value="">Select a category</option>
              {FEEDBACK_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field id="fb-incidentDate" label="Date of issue" required error={errors.incidentDate}>
            <Input
              id="fb-incidentDate"
              type="date"
              max={todayISO()}
              value={incidentDate}
              onChange={(e) => setIncidentDate(e.target.value)}
              {...aria('incidentDate')}
            />
          </Field>
        </div>
        <Field
          id="fb-location"
          label="Location"
          required
          error={errors.location}
          hint="Street name, landmark or neighbourhood. Choose a suggestion or type your own."
        >
          <Input
            id="fb-location"
            list="fb-location-list"
            value={location}
            maxLength={120}
            onChange={(e) => setLocation(e.target.value)}
            {...aria('location')}
          />
          <datalist id="fb-location-list">
            {locations.map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
        </Field>
        <Field id="fb-description" label="Description" required error={errors.description}>
          <Textarea
            id="fb-description"
            rows={6}
            value={description}
            maxLength={2000}
            placeholder="What happened, when, and how it affects you."
            onChange={(e) => setDescription(e.target.value)}
            {...aria('description')}
          />
        </Field>
        <span className="-mt-3 text-right text-xs text-muted-foreground">{description.length}/2000</span>

        <div className="flex flex-col gap-1.5">
          <span id="fb-photo-label" className="text-sm font-medium text-foreground">
            Photo evidence <span className="font-normal text-muted-foreground">(optional)</span>
          </span>
          {photo ? (
            <div className="relative w-fit">
              {/* eslint-disable-next-line @next/next/no-img-element -- local data URL preview */}
              <img src={photo} alt="Selected evidence preview" className="max-h-48 rounded-lg border border-border" />
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                className="absolute top-2 right-2 bg-card"
                aria-label="Remove photo"
                onClick={() => {
                  setPhoto(undefined)
                  if (fileRef.current) fileRef.current.value = ''
                }}
              >
                <X />
              </Button>
            </div>
          ) : (
            <label
              htmlFor="fb-photo"
              className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-input bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground transition-colors hover:bg-muted focus-within:ring-2 focus-within:ring-ring"
            >
              {processing ? (
                <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              ) : (
                <ImagePlus className="size-5" aria-hidden="true" />
              )}
              <span>{processing ? 'Processing image…' : 'Choose an image (JPG or PNG, up to 8 MB)'}</span>
              <input
                ref={fileRef}
                id="fb-photo"
                type="file"
                accept="image/*"
                className="sr-only"
                aria-labelledby="fb-photo-label"
                onChange={onFile}
              />
            </label>
          )}
          {errors.photo ? (
            <p role="alert" className="text-xs font-medium text-destructive">
              {errors.photo}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Prototype note: images are resized and stored in this browser only — no file is uploaded to a server.
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-end">
          <Link href="/feedback" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
            Cancel
          </Link>
          <Button type="submit" size="lg" disabled={processing}>
            Submit feedback
          </Button>
        </div>
      </form>
    </Card>
  )
}
