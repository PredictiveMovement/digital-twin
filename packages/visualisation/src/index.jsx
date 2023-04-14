import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import App from './App'
import { SocketIOProvider } from './context/socketIOProvider'
import 'moment-duration-format'
import { ThemeProvider, createTheme } from '@mui/material'

const darkTheme = createTheme({
  overrides: {
    MuiStepIcon: {
      root: {
        '&$completed': {
          color: 'pink',
        },
        '&$active': {
          color: 'red',
        },
      },
      active: {},
      completed: {},
    },
  },
  palette: {
    mode: 'dark',
    primary: {
      main: '#10c57b',
    },
  },
})

ReactDOM.render(
  <SocketIOProvider
    url={import.meta.env.VITE_SIMULATOR_URL || 'http://localhost:4000'}
    opts={{ withCredentials: true }}
  >
    <ThemeProvider theme={darkTheme}>
      <App />
    </ThemeProvider>
  </SocketIOProvider>,
  document.getElementById('root')
)
