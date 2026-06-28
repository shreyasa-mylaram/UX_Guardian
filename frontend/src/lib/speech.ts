// --- Smallest.ai Text-to-Speech Engine ---
export class SpeechEngine {
  private currentAudio: HTMLAudioElement | null = null
  private API_KEY = 'sk_646e8ff9cf34e1fa394abb0ba31b96e5'
  private API_URL = 'https://waves-api.smallest.ai/api/v1/lightning/get_speech'

  async speak(text: string, options?: { rate?: number; pitch?: number }) {
    this.stop()

    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text,
          voice_id: 'lisa', // Default professional voice
          speed: options?.rate || 1.0
        })
      })

      if (!response.ok) {
        console.error("Smallest.ai API Error:", await response.text())
        // Fallback to browser TTS if API fails
        this.fallbackSpeak(text, options)
        return
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      
      this.currentAudio = new Audio(audioUrl)
      this.currentAudio.play()

    } catch (e) {
      console.error("Failed to call Smallest.ai, falling back to browser TTS", e)
      this.fallbackSpeak(text, options)
    }
  }

  private fallbackSpeak(text: string, options?: { rate?: number; pitch?: number }) {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = options?.rate || 1
    utterance.pitch = options?.pitch || 1
    window.speechSynthesis.speak(utterance)
  }

  generateScreenReaderScript(issues: any[]) {
    if (!issues || issues.length === 0) return [{ text: "Page is accessible. No issues found." }]

    const issueDescriptions = issues.map((issue) => {
      // Create a garbled, confusing description of what a screen reader would see
      const elementType = issue.element || 'Unknown Element'
      
      if (issue.category === 'Accessibility') {
        if (issue.title.toLowerCase().includes('alt')) {
          return `Graphic. Image 4 9 2 8 1 dot J P G. Unlabeled.`
        }
        if (issue.title.toLowerCase().includes('contrast')) {
          return `Text. Unreadable low contrast. Link.`
        }
        if (issue.title.toLowerCase().includes('label')) {
          return `Edit text. Blank. Unlabeled input field.`
        }
      }
      return `${elementType}. Error: ${issue.title}.`
    })

    return [
      { text: "Heading Level 1. Main Navigation." },
      ...issueDescriptions.map(desc => ({ text: desc })),
      { text: "End of main region." }
    ]
  }

  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio.currentTime = 0
      this.currentAudio = null
    }
    window.speechSynthesis.cancel()
  }
}

export const speechEngine = new SpeechEngine()

// --- Speech Recognition (Speech-to-Text) ---
export class VoiceRecognition {
  private recognition: any = null
  
  constructor() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition()
      this.recognition.continuous = false
      this.recognition.interimResults = true
      this.recognition.lang = 'en-US'
    }
  }

  isSupported() {
    return !!this.recognition
  }

  start(
    onResult: (text: string, isFinal: boolean) => void,
    onError: (error: any) => void,
    onEnd: () => void
  ) {
    if (!this.recognition) return

    this.recognition.onresult = (event: any) => {
      let finalTranscript = ''
      let interimTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript
        } else {
          interimTranscript += event.results[i][0].transcript
        }
      }
      
      if (finalTranscript) {
        onResult(finalTranscript, true)
      } else if (interimTranscript) {
        onResult(interimTranscript, false)
      }
    }

    this.recognition.onerror = onError
    this.recognition.onend = onEnd
    
    try {
      this.recognition.start()
    } catch (e) {
      console.warn("Speech recognition already started or failed to start", e)
    }
  }

  stop() {
    if (this.recognition) {
      this.recognition.stop()
    }
  }
}

export const voiceRecognition = new VoiceRecognition()
