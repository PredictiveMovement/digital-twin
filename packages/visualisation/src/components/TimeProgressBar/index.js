import React from 'react'
import styled from 'styled-components'

const Wrapper = styled.div`
  position: absolute;
  bottom: 2.5rem;
  left: 15rem;
  height: 50px;
  display: flex;
  align-items: center;
`

const Container = styled.div`
  height: 8px;
  width: 70vw;
  background-color: #c2c2c1;
  height: 2px;
`

const Filler = styled.div`
  height: '100%';
  width: ${({ completed }) => `${completed}%`};
  background-color: #13c57b;
  transition: 'width 1s ease-in-out';
  height: 2px;
`

const Total = styled.div`
  width: ${({ completed }) => `${completed}%`};
  height: 2px;
  border-radius: 6px;
`

const Circle = styled.div`
  height: 10px;
  width: 10px;
  background-color: #13c57b;
  border-radius: 50%;
  position: absolute;
  top: 1.3rem;
  left: ${({ completed }) => `${completed - 0.3}%`};
`

const ProgressBar = ({ time }) => {
  const totalMinutes =
    new Date(time).getHours() * 60 + new Date(time).getMinutes()

  const completed = (totalMinutes / 1440) * 100

  return (
    <Wrapper>
      <Container>
        <Filler completed={completed}>
          {completed !== 100 && <Circle completed={completed} />}
          <Total completed={completed} />
        </Filler>
      </Container>
    </Wrapper>
  )
}

export default ProgressBar
