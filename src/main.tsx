import '@stisla/vanilla/dist/stisla.css'
// @ts-expect-error - no type declarations for vanilla JS package
import '@stisla/vanilla'
import './style.css'
import { render } from 'preact'
import { App } from './app'

render(<App />, document.getElementById('app')!)
