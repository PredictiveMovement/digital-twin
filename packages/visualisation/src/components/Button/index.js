import React from 'react'
import styled from 'styled-components'

const StyledButton = styled.button`
  width: 162px;
  height: 50px;
  background-color: #fefefe;
  border: none;
  position: absolute;
  z-index: 2;
  cursor: pointer;
  font-size: 14px;
  font-family: Arial, Helvetica, sans-serif;
  border-radius: 2px;
`

const Button = ({ text, onClick }) => {
  return <StyledButton onClick={() => onClick()}>{text}</StyledButton>
}

export default Button
