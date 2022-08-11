import React from 'react'
import styled from 'styled-components'

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
  font-size: 20px;
  color: white;
  z-index: 3;
`

const Loading = () => {
  return (
    <Wrapper>
      <Text>Laddar...</Text>
      <SubText>Detta tar cirka 25 sekunder</SubText>
    </Wrapper>
  )
}

export default Loading
