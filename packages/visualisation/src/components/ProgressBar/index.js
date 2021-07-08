import React from "react";
import styled from 'styled-components'

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  margin-top: 0.5rem;
`

const Percentage = styled.p`
  padding-left: 0.5rem;
  margin: 0;
  color: white;
`

const Container = styled.div`
  height: 13px;
  width: 170px;
  background-color: "#e0e0de";
  border-radius: 6px;
  border: 1px solid white;
`

const Filler = styled.div`
  height: '100%';
  width: ${(props) => `${props.completed}%`};
  background-color: white;
  text-align: 'right';
  border-radius: 4px;
`

const Total = styled.div`
  width: ${(props) => `${props.completed}%`};
  height: 13px;
  border-radius: 6px;
`

const ProgressBar = ({ completed }) => {
  return (
    <Wrapper>
      <Container>
        <Filler completed={completed}>
          <Total completed={completed} />
        </Filler>
      </Container>
      <Percentage>{completed}%</Percentage>
    </Wrapper>
  );
};

export default ProgressBar;