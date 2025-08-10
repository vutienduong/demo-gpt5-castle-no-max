import * as THREE from 'three'

export type Character = {
  name: string
  mesh: THREE.Object3D
  lines: string[]
}

export class DialogueSystem {
  private readonly root: HTMLDivElement
  private readonly nameEl: HTMLSpanElement
  private readonly contentEl: HTMLDivElement
  private readonly actionsEl: HTMLDivElement
  private readonly closeBtn: HTMLButtonElement

  private current: Character | null = null
  private lineIndex = 0

  constructor(
    root: HTMLDivElement,
    nameEl: HTMLSpanElement,
    contentEl: HTMLDivElement,
    actionsEl: HTMLDivElement,
    closeBtn: HTMLButtonElement
  ) {
    this.root = root
    this.nameEl = nameEl
    this.contentEl = contentEl
    this.actionsEl = actionsEl
    this.closeBtn = closeBtn

    this.closeBtn.addEventListener('click', () => this.close())
  }

  open(character: Character) {
    this.current = character
    this.lineIndex = 0
    this.nameEl.textContent = character.name
    this.contentEl.textContent = character.lines[this.lineIndex] || ''
    this.renderActions()
    this.root.classList.remove('hidden')
  }

  private renderActions() {
    this.actionsEl.innerHTML = ''
    const next = document.createElement('button')
    next.className = 'dialogue-btn'
    next.textContent = this.lineIndex < (this.current?.lines.length || 0) - 1 ? 'Continue' : 'Goodbye'
    next.addEventListener('click', () => {
      if (!this.current) return
      if (this.lineIndex < this.current.lines.length - 1) {
        this.lineIndex += 1
        this.contentEl.textContent = this.current.lines[this.lineIndex]
        this.renderActions()
      } else {
        this.close()
      }
    })
    this.actionsEl.appendChild(next)
  }

  close() {
    this.root.classList.add('hidden')
    this.current = null
  }
}



