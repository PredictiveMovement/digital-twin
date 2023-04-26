import React from 'react'
import styled from 'styled-components'

const Wrapper = styled.div`
  position: absolute;
  bottom: 2.5rem;
  height: 50px;
  display: flex;
  align-items: center;
  left: 12rem;
  right: 5rem;
`

const Container = styled.div`
  height: 8px;
  width: 100%;
  zindex: 1000;
  background-color: #c2c2c1;
  height: 2px;

  ${Wrapper}:hover & {
    height: 8px;
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
  left: ${({ completed }) => `calc(${completed}% - 5px)`};

  ${Wrapper}:hover & {
    height: 30px;
    width: 30px;
    left: ${({ completed }) => `calc(${completed}% - 10px)`};
    top: 9px;
  }
`

const TimeStamp = styled.p`
  color: #ffff;
  font-weight: bold;
`

const TimeWrapper = styled.div`
  left: ${({ completed }) => `calc(${completed}% - 16px)`};
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
          <TimeStamp>
            {new Date(time).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </TimeStamp>
        </TimeWrapper>
      </Container>
    </Wrapper>
  )
}

export default ProgressBar
