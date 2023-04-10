import React from 'react'
import styled from 'styled-components'
import logo from '../../icons/svg/pmLogo.svg'
import { keyframes } from 'styled-components'
import { Stepper, Step, StepLabel } from '@mui/material'

const Wrapper = styled.div`
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 3;
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
`

const Text = styled.p`
  font-size: 30px;
  color: white;
  z-index: 3;
`

const SubText = styled.p`
  padding-top: 1rem;
  font-size: 15px;
  font-weight: bold;
  color: white;
  z-index: 3;
`

const pulseAnimation = keyframes`
  0%
  {
    transform: scale( 1.1 );
  }
  50%
  {
    transform: scale( 1.8 );
  }
  100%
  {
    transform: scale( 1.1 );
  }
`
const PulseIcon = styled.img`
  animation-name: ${pulseAnimation};
  animation-duration: 4s;
  animation-iteration-count: infinite;
`

const Loading = ({
  passengers,
  connected,
  cars,
  bookings,
  busStops,
  kommuner,
  lineShapes,
}) => {
  let activeStep = 0
  if (!connected) activeStep = 0
  else if (!kommuner) activeStep = 2
  else if (!cars) activeStep = 3
  else if (!busStops) activeStep = 4
  else if (!passengers) activeStep = 5

  return (
    <Wrapper>
      <PulseIcon alt="Predictive Movement Logo" src={logo} />
      <SubText>Predictive Movement</SubText>
      <Stepper activeStep={activeStep} orientation="vertical">
        <Step key={1}>
          <StepLabel>Kontaktar servern...</StepLabel>
        </Step>
        <Step key={2}>
          <StepLabel>Hämtar {kommuner} kommuner</StepLabel>
        </Step>
        <Step key={3}>
          <StepLabel>Hämtar {cars} fordon</StepLabel>
        </Step>
        <Step key={4}>
          <StepLabel>
            Hämtar {busStops} busstationer och beräknar rutter
          </StepLabel>
        </Step>
        <Step key={5}>
          <StepLabel>Genererar {passengers} passagerare</StepLabel>
        </Step>
      </Stepper>
    </Wrapper>
  )
}

export default Loading
