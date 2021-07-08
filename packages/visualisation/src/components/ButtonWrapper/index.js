
import React from 'react';
import styled from 'styled-components'

const Wrapper = styled.div`
position: absolute;
bottom: 40px;
left: 20px;
display: flex;
flex-direction: column;
justify-content: space-space-between;
`

const Button = styled.button`
background-color:${props => props.inverted ? '#10C57B' : '#FFFFFF'};
color: ${props => props.inverted ? '#FFFFFF' : '#10C57B'};
border: none;
padding: 20px 45px;
margin: 5px 0px;
font-size: 20px;
font-family: Arial;
cursor: pointer;
opacity: 0.6;
`

const ButtonWrapper = ({ turnOnPM, turnOffPM }) => {
    return (
        <Wrapper>
            <Button onClick={turnOnPM} inverted={true}>Start PM</Button>
            <Button onClick={turnOffPM}>Stäng av PM</Button>
        </Wrapper>
    )
}

export default ButtonWrapper;