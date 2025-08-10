import './style.css'
import { initGame } from './modules/game'

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) {
  throw new Error('#app not found')
}

initGame(app)
