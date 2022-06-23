import { useState } from 'react'
import styled from 'styled-components'
import { H2, H3 } from '../Typography'
import OpenArrow from '../../icons/svg/OpenArrow'
import CloseArrow from '../../icons/svg/CloseArrow'

const Arrow = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: none;
  background-color: inherit;
  cursor: pointer;
  width: ${(props) => (props.small ? '90%' : '100%')};
  padding: 0;
  gap: 1rem;
`

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: ${(props) => (props.small ? '1rem' : 0)};
`

const DropDown = ({ title, small, children }) => {
  const [open, setOpen] = useState(false)
  return (
    <Wrapper small={small}>
      <Arrow small={small} onClick={() => setOpen((current) => !current)}>
        {small ? <H3>{title}</H3> : <H2>{title}</H2>}
        {open ? <CloseArrow /> : <OpenArrow />}
      </Arrow>
      {open && children}
    </Wrapper>
  )
}

export default DropDown
