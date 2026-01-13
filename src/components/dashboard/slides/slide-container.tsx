'use client'

import { useState, useEffect, useCallback, ReactNode } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Download,
  X,
  Grid,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EXECUTIVE_COLORS } from '../executive-charts/chart-utils'

interface SlideContainerProps {
  slides: ReactNode[]
  title?: string
  onExportPDF?: () => void
  autoPlayInterval?: number // ms
  className?: string
}

export function SlideContainer({
  slides,
  title = 'Presentación Ejecutiva',
  onExportPDF,
  autoPlayInterval = 10000,
  className = '',
}: SlideContainerProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showThumbnails, setShowThumbnails] = useState(false)

  const totalSlides = slides.length

  // Navegación
  const goToSlide = useCallback((index: number) => {
    if (index >= 0 && index < totalSlides) {
      setCurrentSlide(index)
    }
  }, [totalSlides])

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides)
  }, [totalSlides])

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides)
  }, [totalSlides])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault()
          nextSlide()
          break
        case 'ArrowLeft':
          e.preventDefault()
          prevSlide()
          break
        case 'Escape':
          if (isFullscreen) {
            setIsFullscreen(false)
          }
          break
        case 'f':
        case 'F':
          setIsFullscreen((prev) => !prev)
          break
        case 'g':
        case 'G':
          setShowThumbnails((prev) => !prev)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [nextSlide, prevSlide, isFullscreen])

  // Auto-play
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(nextSlide, autoPlayInterval)
    return () => clearInterval(interval)
  }, [isPlaying, nextSlide, autoPlayInterval])

  // Fullscreen API
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  return (
    <div
      className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''} ${className}`}
    >
      {/* Header Controls */}
      <div
        className={`flex items-center justify-between p-4 border-b ${
          isFullscreen ? 'bg-background/95 backdrop-blur' : ''
        }`}
      >
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-executive-navy">{title}</h2>
          <span className="text-sm text-muted-foreground">
            {currentSlide + 1} / {totalSlides}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Auto-play toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? 'Pausar' : 'Reproducir'}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>

          {/* Grid view */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowThumbnails(!showThumbnails)}
            title="Vista en cuadrícula (G)"
          >
            <Grid className="h-4 w-4" />
          </Button>

          {/* Export PDF */}
          {onExportPDF && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onExportPDF}
              title="Exportar PDF"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}

          {/* Fullscreen toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            title="Pantalla completa (F)"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>

          {/* Close fullscreen */}
          {isFullscreen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(false)}
              title="Cerrar (ESC)"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Slide Area */}
      <div className={`relative ${isFullscreen ? 'h-[calc(100vh-120px)]' : 'h-[600px]'}`}>
        {showThumbnails ? (
          // Thumbnail Grid View
          <div className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-auto h-full">
            {slides.map((slide, index) => (
              <button
                key={index}
                onClick={() => {
                  goToSlide(index)
                  setShowThumbnails(false)
                }}
                className={`relative aspect-video bg-muted rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                  currentSlide === index
                    ? 'border-executive-navy ring-2 ring-executive-navy/20'
                    : 'border-transparent hover:border-border'
                }`}
              >
                <div className="absolute inset-0 p-2 transform scale-[0.25] origin-top-left w-[400%] h-[400%]">
                  {slide}
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <span className="text-white text-xs font-medium">Slide {index + 1}</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          // Single Slide View
          <div className="h-full flex items-center justify-center p-6">
            <div
              className="w-full h-full bg-white rounded-lg shadow-executive-lg overflow-hidden"
              style={{ aspectRatio: '16/9', maxHeight: '100%' }}
            >
              {slides[currentSlide]}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      {!showThumbnails && (
        <>
          {/* Previous Button */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/90 shadow-lg hover:bg-white transition-all hover:scale-110 disabled:opacity-50"
            disabled={currentSlide === 0}
          >
            <ChevronLeft className="h-6 w-6 text-executive-navy" />
          </button>

          {/* Next Button */}
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/90 shadow-lg hover:bg-white transition-all hover:scale-110 disabled:opacity-50"
            disabled={currentSlide === totalSlides - 1}
          >
            <ChevronRight className="h-6 w-6 text-executive-navy" />
          </button>
        </>
      )}

      {/* Progress Dots */}
      <div className="flex items-center justify-center gap-2 p-4">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              currentSlide === index
                ? 'w-6 bg-executive-navy'
                : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
            }`}
          />
        ))}
      </div>

      {/* Keyboard shortcuts hint */}
      {isFullscreen && (
        <div className="absolute bottom-4 left-4 text-xs text-muted-foreground/60">
          ← → Navegar | Espacio Siguiente | F Pantalla completa | G Cuadrícula | ESC Salir
        </div>
      )}
    </div>
  )
}

export default SlideContainer
