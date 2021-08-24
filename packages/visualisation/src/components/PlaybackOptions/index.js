import React from 'react'
import styled from 'styled-components'
import Play from '../../icons/play.svg'
import Pause from '../../icons/pause.svg'
import Speed from '../../icons/speedIcon.svg'
import { Rabbit, Snail } from '../../icons/icons'
import Slider, { Range } from 'rc-slider'
import 'rc-slider/assets/index.css'

const StyledPlayButton = styled.button`
  img {
    height: 60px;
    width: 60px;
  }
`

const StyledButton = styled.button`
  background: transparent;
  border: none;

  &::focus {
    outline: none;
  }
`

const Wrapper = styled.div`
  position: absolute;
  bottom: 2rem;
  left: 1.5rem;
  z-index: 2;
  display: flex;
  align-items: center;
`

const SliderWrapper = styled.div`
  width: 100%;
  height: 10vh;
  position: absolute;
  bottom: 8rem;
  left: 2.7rem;
  z-index: 2;

  .rc-slider-mark-text {
    display: none;
  }
  .rc-slider-mark-text-active {
    display: block;
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
    <StyledButton onClick={handleOnClick}>
      {clicked ? (
        <img src={Play} alt="Play streams" />
      ) : (
        <img src={Pause} alt="Pause streams " />
      )}
    </StyledButton>
  )
}

const SpeedButton = ({ setActive }) => {
  const handleOnClick = () => {
    setActive((active) => !active)
  }

  return (
    <div>
      <StyledButton onClick={handleOnClick}>
        <img src={Speed} />
      </StyledButton>
    </div>
  )
}

const SpeedSlider = ({ onSpeedChange }) => {
  const marks = {
    0: {
      style: {
        bottom: '-16px',
        marginLeft: '0.5rem',
        marginBottom: '0',
        width: '36px',
      },
      label: <Snail />,
    },
    50: '',
    100: {
      style: {
        marginLeft: '0.5rem',
        bottom: '85%',
        marginBottom: '0',
      },
      label: <Rabbit />,
    },
  }

  const handleOnChange = (value) => {
    onSpeedChange(value)
  }

  return (
    <SliderWrapper>
      <Slider
        vertical={true}
        handleStyle={{
          borderColor: 'white',
          height: 24,
          width: 24,
          marginLeft: -10.8,
          marginTop: -9,
          backgroundColor: 'white',
        }}
        defaultValue={100}
        included={false}
        step={50}
        marks={marks}
        min={0}
        max={100}
        trackStyle={{ backgroundColor: 'white', height: 10 }}
        onChange={handleOnChange}
      />
    </SliderWrapper>
  )
}

const PlaybackOptions = ({ onPause, onPlay, onSpeedChange }) => {
  const [active, setActive] = React.useState(false)
  return (
    <>
      {active && <SpeedSlider onSpeedChange={onSpeedChange} />}
      <Wrapper>
        <SpeedButton setActive={setActive} active={active} />
        <PlayButton onPause={onPause} onPlay={onPlay} />
      </Wrapper>
    </>
  )
}

export default PlaybackOptions
