import React from 'react';
import styled from 'styled-components'

const StyledButton = styled.button`
width: 166px;
height: 50px;
background-color:  #10C57B;
border: none;
position: absolute;
z-index: 2;
cursor: pointer;
font-size: 18px;
color: white;
font-family: Arial, Helvetica, sans-serif;
border-radius: 2px;
bottom: 50px;
right: 50px;
`



const Buton = ({ text, onClick }) => {
    return (
        <StyledButton onClick={() => onClick()}>{text}</StyledButton>
    )
}

export default Buton;
