import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import App from './App'
// import reportWebVitals from './reportWebVitals'
import { SocketIOProvider } from './context/socketIOProvider'

ReactDOM.render(
  <SocketIOProvider
    url={process.env.REACT_APP_SIMULATOR_URL || 'http://localhost:4000'}
  >
    <App />
  </SocketIOProvider>,
  document.getElementById('root')
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
//reportWebVitals();
