import React from 'react'
import styled from 'styled-components'

const StyledButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;

  &::focus {
    outline: none;
  }
`

const TransparentButton = ({
  onClick,
  onMouseEnter,
  onMouseLeave,
  children,
}) => {
  return (
    <StyledButton
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </StyledButton>
  )
}

export default TransparentButton
