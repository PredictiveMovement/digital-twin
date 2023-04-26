import React, { useState } from 'react'
import styled from 'styled-components'
import Play from '../../icons/play.svg'
import Pause from '../../icons/pause.svg'
import { Rabbit, Snail } from '../../icons/icons'
import Slider from 'rc-slider'
import 'rc-slider/assets/index.css'
import TransparentButton from '../TransparentButton'

const Wrapper = styled.div`
  position: absolute;
  bottom: 2rem;
  left: 2rem;
  z-index: 2;
  display: flex;
  align-items: center;
`

const SliderWrapper = styled.div`
  width: 100px;
  height: 14vh;
  position: absolute;
  bottom: 6rem;
  left: 1.5rem;
  z-index: 2;
  position: absolute;
  padding-top: 30px;
  padding-bottom: 30px;
  display: flex;
  justify-content: center;

  .rc-slider-mark-text {
    display: none;
  }
  .rc-slider-mark-text-active {
    display: block;
  }
`

const PlayButton = ({ onPause, onPlay, onMouseEnter, onMouseLeave }) => {
  const [clicked, setClicked] = React.useState(false)
  const handleOnClick = () => {
    setClicked((clicked) => !clicked)
    if (!clicked) return onPause()
    onPlay()
  }

  return (
    <TransparentButton
      onClick={handleOnClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {clicked ? (
        <img src={Play} alt="Play streams" />
      ) : (
        <img src={Pause} alt="Pause streams " />
      )}
    </TransparentButton>
  )
}

const SpeedSlider = ({
  onSpeedChange,
  onMouseEnter,
  onMouseLeave,
  setSpeed,
  speed,
}) => {
  const marks = {
    10: {
      style: {
        bottom: '-16px',
        marginLeft: '0.5rem',
        marginBottom: '0',
        width: '36px',
      },
      label: <Snail />,
    },
    900: {
      style: {
        marginLeft: '0.5rem',
        bottom: '85%',
        marginBottom: '0',
      },
      label: <Rabbit />,
    },
  }

  return (
    <SliderWrapper onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
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
        defaultValue={speed}
        included={false}
        step={100}
        marks={marks}
        min={2}
        max={900}
        trackStyle={{ backgroundColor: 'white', height: 10 }}
        onChange={(value) => {
          setSpeed(value)
          onSpeedChange(value)
        }}
      />
    </SliderWrapper>
  )
}

const PlaybackOptions = ({ onPause, onPlay, onSpeedChange }) => {
  const [active, setActive] = useState(false)
  const [speed, setSpeed] = useState(60)
  return (
    <>
      {active && (
        <SpeedSlider
          onSpeedChange={onSpeedChange}
          onMouseEnter={() => setActive(true)}
          onMouseLeave={() => setActive(false)}
          setSpeed={setSpeed}
          speed={speed}
        />
      )}
      <Wrapper>
        <PlayButton
          onPause={onPause}
          onPlay={onPlay}
          onMouseEnter={() => setActive(true)}
          onMouseLeave={() => setActive(false)}
        />
      </Wrapper>
    </>
  )
}

export default PlaybackOptions
