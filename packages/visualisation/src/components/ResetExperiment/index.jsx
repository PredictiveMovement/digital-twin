import React from 'react'
import styled from 'styled-components'
import ResetIcon from '../../icons/svg/resetIcon.svg'
import TransparentButton from '../TransparentButton'

const Wrapper = styled.div`
  position: absolute;
  z-index: 2;
  bottom: 3rem;
  left: 8.3rem;
`

const ResetExperiment = ({ resetSimulation }) => {
  return (
    <Wrapper>
      <TransparentButton onClick={() => resetSimulation()}>
        <img src={ResetIcon} alt="Reset" />
      </TransparentButton>
    </Wrapper>
  )
}

export default ResetExperiment
