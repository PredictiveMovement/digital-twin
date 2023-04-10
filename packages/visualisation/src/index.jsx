import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import App from './App'
// import reportWebVitals from './reportWebVitals'
import { SocketIOProvider } from './context/socketIOProvider'
import 'moment-duration-format'
import { ThemeProvider, createTheme } from '@mui/material'

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
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

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
//reportWebVitals();
