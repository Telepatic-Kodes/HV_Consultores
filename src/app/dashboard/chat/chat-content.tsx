'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  MessageSquare,
  Send,
  Bot,
  User,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react'
import { enviarMensaje, darFeedback, eliminarSesion, getOrCreateSesion } from './actions'
import type { SesionConMensajes } from './actions'
import type { Database } from '@/types/database.types'

type ChatMensaje = Database['public']['Tables']['chat_mensajes']['Row']

interface ChatContentProps {
  sesiones: SesionConMensajes[]
  sesionActual: SesionConMensajes | null
}

export function ChatContent({ sesiones, sesionActual }: ChatContentProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMensaje[]>(sesionActual?.mensajes || [])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (sesionActual?.mensajes) {
      setMessages(sesionActual.mensajes)
    }
  }, [sesionActual])

  const handleSend = async () => {
    if (!input.trim() || isLoading || !sesionActual) return

    const userMessage: ChatMensaje = {
      id: crypto.randomUUID(),
      sesion_id: sesionActual.id,
      rol: 'user',
      contenido: input,
      created_at: new Date().toISOString(),
      fuentes: null,
      tokens_input: null,
      tokens_output: null,
      modelo_usado: null,
      latencia_ms: null,
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    const result = await enviarMensaje(sesionActual.id, input)

    if (result.success && result.respuesta) {
      setMessages(prev => [...prev, result.respuesta!])
    }

    setIsLoading(false)
  }

  const handleNewChat = async () => {
    startTransition(async () => {
      const nuevaSesion = await getOrCreateSesion()
      if (nuevaSesion) {
        router.push(`/dashboard/chat?sesion=${nuevaSesion.id}`)
      }
    })
  }

  const handleSelectSesion = (sesionId: string) => {
    router.push(`/dashboard/chat?sesion=${sesionId}`)
  }

  const handleDeleteSesion = async (sesionId: string) => {
    startTransition(async () => {
      await eliminarSesion(sesionId)
      if (sesionActual?.id === sesionId) {
        router.push('/dashboard/chat')
      }
    })
  }

  const handleFeedback = async (mensajeId: string, rating: 1 | 5) => {
    await darFeedback(mensajeId, rating)
  }

  const formatTime = (fecha: string | null) => {
    if (!fecha) return ''
    return new Date(fecha).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
  }

  const parseFuentes = (fuentes: any): { titulo: string; contenido: string }[] => {
    if (!fuentes) return []
    if (Array.isArray(fuentes)) return fuentes
    try {
      return JSON.parse(fuentes)
    } catch {
      return []
    }
  }

  return (
    <main className="p-8 h-[calc(100vh-8rem)]">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-1 w-8 bg-gradient-to-r from-primary to-secondary rounded-full" />
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Asistente IA Tributario
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-4 h-[calc(100%-3rem)]">
        {/* Sidebar - Conversations */}
        <Card className="lg:col-span-1 hidden lg:flex flex-col border-border/50 shadow-executive">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="h-3.5 w-3.5 text-primary" />
                </div>
                <CardTitle className="text-sm font-semibold">Conversaciones</CardTitle>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleNewChat}
                disabled={isPending}
                className="h-7 w-7 p-0 hover:bg-primary/10 rounded-lg"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-2">
            <div className="space-y-1">
              {sesiones.length === 0 ? (
                <div className="text-center py-10">
                  <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="h-5 w-5 text-muted-foreground/50" />
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">No hay conversaciones</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1">Inicia una nueva consulta</p>
                </div>
              ) : (
                sesiones.map((sesion) => (
                  <div
                    key={sesion.id}
                    className={`group relative w-full text-left p-3 rounded-lg transition-all duration-200 cursor-pointer ${
                      sesionActual?.id === sesion.id
                        ? 'bg-primary/8 border-l-2 border-l-primary'
                        : 'hover:bg-muted/40 border-l-2 border-l-transparent'
                    }`}
                    onClick={() => handleSelectSesion(sesion.id)}
                  >
                    <p className="font-semibold text-sm truncate pr-6 text-foreground">{sesion.titulo}</p>
                    <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-muted-foreground/70 font-mono">
                      <Clock className="h-3 w-3" />
                      {new Date(sesion.updated_at || sesion.created_at || '').toLocaleDateString('es-CL')}
                      <span className="text-muted-foreground/30">|</span>
                      <span className="text-muted-foreground">{sesion.mensajes?.length || 0} msgs</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteSesion(sesion.id)
                      }}
                      className="absolute right-2 top-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-destructive/10 rounded-lg"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Chat */}
        <Card className="lg:col-span-3 flex flex-col border-border/50 shadow-executive overflow-hidden">
          {/* Chat Header */}
          <div className="px-6 py-4 border-b border-border/40 bg-gradient-to-r from-muted/30 to-transparent">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center shadow-sm">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">HV-Chat Tributario</h3>
                <p className="text-xs text-muted-foreground">Asistente especializado en contabilidad chilena</p>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                <span className="text-xs text-success font-medium">Online</span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <CardContent className="flex-1 overflow-auto p-6 bg-gradient-to-b from-transparent to-muted/10">
            <div className="space-y-6">
              {messages.length === 0 && !isLoading && (
                <div className="text-center py-16">
                  <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-br from-secondary/20 to-primary/20 flex items-center justify-center mb-4">
                    <Bot className="h-8 w-8 text-primary" />
                  </div>
                  <h4 className="font-semibold text-foreground">Bienvenido al Asistente Tributario</h4>
                  <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                    Consulta sobre normativa SII, declaraciones F29, regimenes tributarios, PPM y mas.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 mt-6">
                    {['Como calcular el PPM?', 'Que es el F29?', 'Regimen Pro Pyme'].map((q) => (
                      <button
                        key={q}
                        onClick={() => setInput(q)}
                        className="px-3 py-1.5 text-xs rounded-full bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message) => {
                const fuentes = parseFuentes(message.fuentes)

                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.rol === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`shrink-0 h-9 w-9 rounded-xl flex items-center justify-center ring-2 ring-offset-2 ring-offset-background ${
                      message.rol === 'user'
                        ? 'bg-primary ring-primary/20'
                        : 'bg-gradient-to-br from-secondary to-primary ring-secondary/20'
                    }`}>
                      {message.rol === 'user' ? (
                        <User className="h-4 w-4 text-primary-foreground" />
                      ) : (
                        <Bot className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <div className={`flex-1 max-w-[80%] ${message.rol === 'user' ? 'text-right' : ''}`}>
                      <div className={`inline-block rounded-2xl px-4 py-3 ${
                        message.rol === 'user'
                          ? 'bg-primary text-primary-foreground rounded-tr-sm'
                          : 'bg-card border border-border/50 shadow-sm rounded-tl-sm'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.contenido}</p>
                      </div>

                      {/* Sources */}
                      {fuentes.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold">Fuentes consultadas:</p>
                          {fuentes.map((source, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-2 p-3 rounded-lg border border-border/40 bg-card/50 text-left"
                            >
                              <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center shrink-0">
                                <FileText className="h-3 w-3 text-primary" />
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-foreground">{source.titulo}</p>
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{source.contenido}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Feedback buttons for assistant */}
                      {message.rol === 'assistant' && (
                        <div className="mt-2 flex items-center gap-1">
                          <button
                            className="p-1.5 rounded-lg hover:bg-success/10 transition-colors group"
                            onClick={() => handleFeedback(message.id, 5)}
                          >
                            <ThumbsUp className="h-3.5 w-3.5 text-muted-foreground group-hover:text-success" />
                          </button>
                          <button
                            className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors group"
                            onClick={() => handleFeedback(message.id, 1)}
                          >
                            <ThumbsDown className="h-3.5 w-3.5 text-muted-foreground group-hover:text-destructive" />
                          </button>
                          <span className="text-[10px] text-muted-foreground/60 font-mono ml-2">
                            {formatTime(message.created_at)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              {isLoading && (
                <div className="flex gap-3">
                  <div className="shrink-0 h-9 w-9 rounded-xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center ring-2 ring-offset-2 ring-offset-background ring-secondary/20">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-card border border-border/50 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-secondary" />
                      <span className="text-sm text-muted-foreground">Analizando consulta...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </CardContent>

          {/* Input */}
          <div className="p-4 border-t border-border/40 bg-card/50">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="flex gap-3"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu consulta sobre contabilidad o tributacion..."
                className="flex-1 h-11 bg-background border-border/50 focus:border-primary/30"
                disabled={isLoading || !sesionActual}
              />
              <Button
                type="submit"
                disabled={!input.trim() || isLoading || !sesionActual}
                className="h-11 px-5 shadow-executive"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <p className="mt-3 text-[10px] text-center text-muted-foreground/60 uppercase tracking-wider">
              Asistente especializado en normativa SII, F29, regimenes tributarios y contabilidad chilena
            </p>
          </div>
        </Card>
      </div>
    </main>
  )
}
