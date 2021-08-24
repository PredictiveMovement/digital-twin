import React from 'react'
import styled from 'styled-components'
import Play from '../../icons/play.svg'
import Pause from '../../icons/pause.svg'

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

export { PlayButton }
