import React from 'react'
import styled from 'styled-components'

const Wrapper = styled.div`
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 3;
  position: absolute;
`

const Text = styled.p`
  font-size: 30px;
  color: white;
  z-index: 3;
  position: absolute;
  opacity: unset;
  top: 50%;
  right: 50%;
`

const Loading = () => {
  return (
    <Wrapper>
      <Text>Laddar...</Text>
    </Wrapper>
  )
}

export default Loading
