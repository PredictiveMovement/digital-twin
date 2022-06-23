import { useState } from 'react'
import styled from 'styled-components'
import { H2 } from '../Typography'
import OpenArrow from '../../icons/svg/OpenArrow'
import CloseArrow from '../../icons/svg/CloseArrow'

const Arrow = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: none;
  background-color: inherit;
  cursor: pointer;
  width: 100%;
  padding: 0;
  gap: 1rem;
`

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const DropDown = ({ title, children }) => {
  const [open, setOpen] = useState(false)
  return (
    <Wrapper>
      <Arrow onClick={() => setOpen((current) => !current)}>
        <H2>{title}</H2>
        {open ? <CloseArrow /> : <OpenArrow />}
      </Arrow>
      {open && children}
    </Wrapper>
  )
}

export default DropDown
