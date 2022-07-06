import React from 'react'
import styled from 'styled-components'

const StyledButton = styled.button`
  width: 162px;
  height: 50px;
  background-color: #fefefe;
  border: none;
  position: ${(props) => (props.block ? 'block' : 'absolute')};
  z-index: 2;
  cursor: pointer;
  font-size: 14px;
  font-family: Arial, Helvetica, sans-serif;
  border-radius: 2px;
`

const Button = ({ text, onClick, block }) => {
  return (
    <StyledButton onClick={() => onClick()} block={block}>
      {text}
    </StyledButton>
  )
}

export default Button
