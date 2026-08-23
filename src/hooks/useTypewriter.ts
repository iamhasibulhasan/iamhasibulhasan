import { useEffect, useState } from "react"

export function useTypewriter(
  words: string[],
  opts?: { typingSpeed?: number; deletingSpeed?: number; pause?: number },
) {
  const typingSpeed = opts?.typingSpeed ?? 90
  const deletingSpeed = opts?.deletingSpeed ?? 45
  const pause = opts?.pause ?? 1500

  const [index, setIndex] = useState(0)
  const [text, setText] = useState("")
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const current = words[index % words.length]
    let timeout: number

    if (!deleting && text === current) {
      timeout = window.setTimeout(() => setDeleting(true), pause)
    } else if (deleting && text === "") {
      setDeleting(false)
      setIndex((i) => (i + 1) % words.length)
      return
    } else {
      timeout = window.setTimeout(
        () => {
          setText((t) => (deleting ? current.slice(0, t.length - 1) : current.slice(0, t.length + 1)))
        },
        deleting ? deletingSpeed : typingSpeed,
      )
    }

    return () => window.clearTimeout(timeout)
  }, [text, deleting, index, words, typingSpeed, deletingSpeed, pause])

  return text
}
