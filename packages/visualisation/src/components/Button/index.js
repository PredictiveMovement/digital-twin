import React from 'react'
import styled from 'styled-components'
import Play from '../../icons/play.svg'
import Pause from '../../icons/pause.svg'

const StyledButton = styled.button`
  width: 166px;
  height: 50px;
  background-color: #10c57b;
  border: none;
  position: absolute;
  z-index: 2;
  cursor: pointer;
  font-size: 18px;
  color: white;
  font-family: Arial, Helvetica, sans-serif;
  border-radius: 2px;
`

const StyledPlayButton = styled.button`
  position: absolute;
  bottom: 2rem;
  left: 2rem;
  z-index: 2;
  background: transparent;
  border: none;

  img {
    height: 60px;
    width: 60px;
  }

  &::focus {
    outline: none;
  }
`

const Button = ({ text, onClick }) => {
  return <StyledButton onClick={() => onClick()}>{text}</StyledButton>
}

const PlayButton = ({ onPause, onPlay }) => {
  const [clicked, setClicked] = React.useState(false)
  const handleOnClick = () => {
    setClicked((clicked) => !clicked)
    if (!clicked) return onPause()
    onPlay()
  }

  return (
    <StyledPlayButton onClick={handleOnClick}>
      {clicked ? (
        <img src={Play} alt="Play streams" />
      ) : (
        <img src={Pause} alt="Pause streams " />
      )}
    </StyledPlayButton>
  )
}

export { Button, PlayButton }
