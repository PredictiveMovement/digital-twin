import React from 'react'
import styled from 'styled-components'
import logo from '../../icons/svg/pmLogo.svg'
import { keyframes } from 'styled-components'
import {
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Typography,
} from '@mui/material'

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
  else if (!passengers) activeStep = 4
  else activeStep = 5

  return (
    <Wrapper>
      <Stepper activeStep={activeStep} orientation="vertical">
        <Step key={1}>
          <StepLabel>Kontaktar servern...</StepLabel>
          {activeStep === 0 && (
            <StepContent>
              <Typography
                color="white"
                sx={{
                  color: 'white',
                  fontSize: '0.9rem',
                  maxWidth: '300px',
                }}
              >
                Försöker nå simulatorservern hos Predictive Movement. Om detta
                steg tar tid beror det oftast på ett fel som har uppstått. Vänta
                någon minut så startar servrarna om sig automatiskt. Om det
                fortfarande inte fungerar, kontakta teamet på Discord.
              </Typography>
            </StepContent>
          )}
        </Step>
        <Step key={2}>
          <StepLabel>Hämtar {kommuner} kommuner...</StepLabel>
        </Step>
        <Step key={3}>
          <StepLabel>Skapar {cars} fordon...</StepLabel>
        </Step>
        <Step key={4}>
          <StepLabel>Genererar {passengers} passagerare...</StepLabel>
        </Step>
        <Step key={5}>
          <StepLabel>Skapar {busStops} busstationer och rutter...</StepLabel>
        </Step>
      </Stepper>
    </Wrapper>
  )
}

export default Loading
