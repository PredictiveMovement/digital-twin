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

  ${Wrapper}:hover & {
    height: 8px;
  }

  @media (max-width: 1500px) {
    width: 60vw;
  }
`

const Filler = styled.div`
  height: '100%';
  width: ${({ completed }) => `${completed}%`};
  background-color: #13c57b;
  transition: 'width 1s ease-in-out';
  height: 2px;

  ${Wrapper}:hover & {
    height: 8px;
  }
`

const Circle = styled.div`
  height: 10px;
  width: 10px;
  background-color: #13c57b;
  border-radius: 50%;
  position: absolute;
  top: 1.25rem;
  left: ${({ completed }) => `${completed - 0.3}%`};

  ${Wrapper}:hover & {
    height: 30px;
    width: 30px;
    left: ${({ completed }) => `${completed - 1.2}%`};
    top: 9px;
  }
`

const TimeStamp = styled.p`
  color: #ffff;
  font-weight: bold;
`

const TimeWrapper = styled.div`
  left: ${({ completed }) => `${completed - 2.5}%`};
  position: absolute;
  bottom: 2rem;
  display: none;

  ${Wrapper}:hover & {
    display: block;
  }
`

const ProgressBar = ({ time }) => {
  const totalMinutes =
    new Date(time).getHours() * 60 + new Date(time).getMinutes()

  const completed = (totalMinutes / 1440) * 100

  return (
    <Wrapper completed={completed}>
      <Container>
        <Filler completed={completed}>
          {completed !== 100 && <Circle completed={completed} />}
        </Filler>
        <TimeWrapper completed={completed}>
          <TimeStamp>{new Date(time).toLocaleTimeString()}</TimeStamp>
        </TimeWrapper>
      </Container>
    </Wrapper>
  )
}

export default ProgressBar
