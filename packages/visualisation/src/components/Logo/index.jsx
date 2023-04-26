import React from 'react'
import { PMLogo } from '../../icons/icons'
import styled from 'styled-components'

const Wrapper = styled.div`
  position: absolute;
  top: 1em;
  left: 1em;
  padding: 1em;
  z-index: 2;
`

const Logo = () => {
  return (
    <Wrapper>
      <a href="https://predictivemovement.se/" target="_blank" rel="noreferrer">
        <PMLogo />
      </a>
    </Wrapper>
  )
}

export default Logo
