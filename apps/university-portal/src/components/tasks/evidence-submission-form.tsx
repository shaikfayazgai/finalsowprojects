'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  FileUpload,
  TextInput,
  Textarea,
  Button,
} from '@glimmora/ui'

interface EvidenceSubmissionFormProps {
  taskId: string
}

export function EvidenceSubmissionForm({ taskId }: EvidenceSubmissionFormProps) {
  const t = useTranslations('evidence')
  const router = useRouter()
  const [activeType, setActiveType] = useState('file')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [url, setUrl] = useState('')
  const [code, setCode] = useState('')
  const [text, setText] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit() {
    setIsSubmitting(true)
    try {
      await fetch(`/api/tasks/${taskId}/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeType,
          title,
          description,
          content: url || code || text || videoUrl,
        }),
      })
      router.push(`/tasks/${taskId}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <TextInput
        label={t('titleLabel')}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Textarea
        label={t('descriptionLabel')}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <Tabs value={activeType} onValueChange={setActiveType}>
        <TabsList>
          <TabsTrigger value="file">{t('fileUpload')}</TabsTrigger>
          <TabsTrigger value="url">{t('url')}</TabsTrigger>
          <TabsTrigger value="code">{t('code')}</TabsTrigger>
          <TabsTrigger value="video-url">{t('videoUrl')}</TabsTrigger>
          <TabsTrigger value="text">{t('text')}</TabsTrigger>
        </TabsList>

        <TabsContent value="file">
          <FileUpload
            accept=".pdf,.doc,.docx,.zip,.png,.jpg,.jpeg"
            maxFiles={5}
            maxSizeMB={10}
          />
        </TabsContent>
        <TabsContent value="url">
          <TextInput
            placeholder={t('urlPlaceholder')}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </TabsContent>
        <TabsContent value="code">
          <Textarea
            placeholder={t('codePlaceholder')}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="font-mono min-h-[200px]"
          />
        </TabsContent>
        <TabsContent value="video-url">
          <TextInput
            placeholder={t('videoPlaceholder')}
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
          />
        </TabsContent>
        <TabsContent value="text">
          <Textarea
            placeholder={t('textPlaceholder')}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[200px]"
          />
        </TabsContent>
      </Tabs>

      <Button
        variant="primary"
        className="w-full"
        onClick={handleSubmit}
        disabled={isSubmitting}
        loading={isSubmitting}
      >
        {t('submit')}
      </Button>
    </div>
  )
}
